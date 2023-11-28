import { api } from "@/lib/api"
import { GetStaticPaths } from "next"


export const getStaticPaths: GetStaticPaths = async () => {

  const { campings } = await api.query({
    
    campings: {
      data: {
        id: true
      }
    }
  })

  console.log(campings)

  return {
    paths: campings?.data.map(
      c => ({ params: { campingId: c.id }})
    ),
    fallback: true,
  }
}



export default async function Camping({ params }: { params: { campingId: string }}) {
  console.log(params)

  const { camping } = await api.query({
    camping: {
      __args: {  id: params.campingId as string },
      data: {
        id: true,
        __scalar: true,
        attributes: {
          __scalar: true,
          flags: {
            __scalar: true,
            __typename: true
          },
          address: {
            __scalar: true
          },
          medias: {
            data: {
              id: true,
              attributes: {
                __typename: true,
                __scalar: true
              }
            }
          }
        }
      },
      __scalar: true,
      __typename: true
    }
  })


  return (
    <div><pre>{JSON.stringify(camping, null, 2)}</pre></div>
  )
  
}
