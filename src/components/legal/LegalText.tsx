// Legal copy lives in messages/*.json as plain strings: blank-line separated
// paragraphs, where a block whose lines all start with "- " renders as a list.
export function LegalText({ text }: { text: string }) {
  return (
    <div className="mt-2 space-y-3 text-sm leading-6 text-(--muted)">
      {text.split('\n\n').map((block) => {
        const lines = block.split('\n')
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul key={block} className="list-disc space-y-1 pl-5">
              {lines.map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          )
        }
        return <p key={block}>{block}</p>
      })}
    </div>
  )
}
