import { makeGuideRoute } from '@/components/guides/guide-route'

const route = makeGuideRoute('compare', 'en')

// This segment only serves en compare pages; other locales and unknown slugs 404.
export const dynamicParams = false
export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
