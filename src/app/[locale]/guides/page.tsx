import { makeHubRoute } from '@/components/guides/guide-route'

const route = makeHubRoute('guide', 'en')

export const generateMetadata = route.generateMetadata
export default route.Page
