import { makeGuideRoute } from '@/components/guides/guide-route'

const route = makeGuideRoute('guide', 'en')

// This segment only serves en guide pages; other locales and unknown slugs 404.
export const dynamicParams = false
export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
