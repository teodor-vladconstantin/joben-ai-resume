import { makeGuideRoute } from '@/components/guides/guide-route'

const route = makeGuideRoute('glossary', 'ro')

// This segment only serves ro glossary pages; other locales and unknown slugs 404.
export const dynamicParams = false
export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
