import { createClient } from 'api-client'

export const api = createClient({
    url: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`
    }
})