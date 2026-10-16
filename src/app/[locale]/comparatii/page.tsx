import { makeHubRoute } from '@/components/guides/guide-route'

const route = makeHubRoute('compare', 'ro')

export const generateMetadata = route.generateMetadata
export default route.Page
