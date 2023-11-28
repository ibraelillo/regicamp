// https://github.com/kucherenko/strapi-plugin-passwordless

export const routes = {
    passwordless: {
        sendLink: '/api/passwordless/send-link',
        login: (tokenFromEmail: string) => `/api/passwordless/login?loginToken=${tokenFromEmail}`
    }
}