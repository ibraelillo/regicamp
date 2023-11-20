/**
 * 
 * is this a production environment
 * 
 * @param stage 
 * @returns 
 */
export const isProduction = (stage: string) => {
    return ['prod', 'production'].includes(stage)
}