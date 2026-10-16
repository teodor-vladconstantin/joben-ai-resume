import { makeHubRoute } from '@/components/guides/guide-route'

const route = makeHubRoute('glossary', 'en')

export const generateMetadata = route.generateMetadata
export default route.Page
