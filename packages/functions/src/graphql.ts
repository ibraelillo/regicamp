


export const handler = async (evt) => {


    return {
        body: JSON.stringify({
            message: 'hello world'
        }),
        statusCode: 200
    }
}