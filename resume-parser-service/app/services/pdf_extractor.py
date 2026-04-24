import pdfplumber
import numpy as np
from sklearn.cluster import KMeans
from typing import List, Dict, Any

class PDFExtractor:
    """Extract words from PDF and sort them in reading order."""

    def extract(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """Extract words from PDF bytes, detect columns, and sort reading order."""
        pages_data = []
        all_words = []

        with pdfplumber.open(pdf_bytes) as pdf:
            for page in pdf.pages:
                # Extract words with font info
                words = page.extract_words(extra_attrs=['fontname', 'size'])
                page_words = []
                for w in words:
                    word_info = {
                        'text': w['text'],
                        'x0': w['x0'],
                        'x1': w['x1'],
                        'y0': w['y0'],
                        'y1': w['y1'],
                        'font': w['fontname'],
                        'size': w['size'],
                    }
                    page_words.append(word_info)
                    all_words.append(word_info)
                pages_data.append({
                    'page_num': page.page_number - 1,
                    'width': page.width,
                    'height': page.height,
                    'words': page_words
                })

        # Detect number of columns from all words
        n_columns = self.detect_columns(all_words)
        # Sort all words globally in reading order
        sorted_words = self.sort_reading_order(all_words, n_columns)
        # Group sorted words into lines
        lines = self.words_to_lines(sorted_words)

        return {
            'pages': pages_data,
            'words': all_words,
            'sorted_words': sorted_words,
            'lines': lines,
            'metadata': {
                'total_pages': len(pages_data),
                'total_words': len(all_words),
                'detected_columns': n_columns
            }
        }

    def detect_columns(self, words: List[Dict[str, Any]], max_cols: int = 3) -> int:
        """KMeans clustering on x0 to determine number of columns (1-3)."""
        if not words:
            return 1
        x0 = np.array([[w['x0']] for w in words])
        best_k = 1
        best_inertia = float('inf')
        for k in range(1, min(max_cols, len(x0)) + 1):
            kmeans = KMeans(n_clusters=k, random_state=0, n_init=10).fit(x0)
            inertia = kmeans.inertia_
            # Heuristic: if adding another cluster improves inertia by >20%, keep it
            if k == 1:
                best_k = 1
                best_inertia = inertia
            else:
                improvement = (best_inertia - inertia) / best_inertia
                if improvement > 0.2:
                    best_k = k
                    best_inertia = inertia
                else:
                    break
        return best_k

    def sort_reading_order(self, words: List[Dict[str, Any]], n_columns: int) -> List[Dict[str, Any]]:
        """Sort words first by column (left-to-right), then by y (top-to-bottom), then x."""
        if n_columns == 1:
            return sorted(words, key=lambda w: (-w['y0'], w['x0']))
        # Cluster by column using KMeans on x0
        x0 = np.array([[w['x0']] for w in words])
        kmeans = KMeans(n_clusters=n_columns, random_state=0, n_init=10).fit(x0)
        labels = kmeans.labels_
        column_means = {}
        for label in range(n_columns):
            indices = [i for i, l in enumerate(labels) if l == label]
            if indices:
                mean_x = np.mean([words[i]['x0'] for i in indices])
                column_means[label] = mean_x
        # Order columns by mean x (left to right)
        sorted_labels = sorted(column_means.keys(), key=lambda l: column_means[l])
        # Group words by label and sort within each column
        columns = {}
        for label in sorted_labels:
            columns[label] = []
        for i, w in enumerate(words):
            label = labels[i]
            if label in columns:
                columns[label].append(w)
        # Sort within columns: by y (descending because PDF origin bottom-left), then x
        for label in columns:
            columns[label].sort(key=lambda w: (-w['y0'], w['x0']))
        # Concatenate columns in order
        sorted_words = []
        for label in sorted_labels:
            sorted_words.extend(columns[label])
        return sorted_words

    def words_to_lines(self, words: List[Dict[str, Any]], line_threshold: float = 3) -> List[Dict[str, Any]]:
        """Group sorted words into lines based on vertical center proximity."""
        lines = []
        current_line = []
        current_y = None
        for w in words:
            y_center = (w['y0'] + w['y1']) / 2
            if current_y is None:
                current_line = [w]
                current_y = y_center
            else:
                if abs(y_center - current_y) <= line_threshold:
                    current_line.append(w)
                else:
                    # Finalize current line
                    line_text = ' '.join(word['text'] for word in current_line)
                    lines.append({
                        'words': current_line,
                        'y': current_y,
                        'text': line_text
                    })
                    current_line = [w]
                    current_y = y_center
        if current_line:
            line_text = ' '.join(word['text'] for word in current_line)
            lines.append({
                'words': current_line,
                'y': current_y,
                'text': line_text
            })
        return lines
