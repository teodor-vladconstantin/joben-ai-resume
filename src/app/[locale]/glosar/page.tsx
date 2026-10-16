import { makeHubRoute } from '@/components/guides/guide-route'

const route = makeHubRoute('glossary', 'ro')

export const generateMetadata = route.generateMetadata
export default route.Page
