


import { GraphQLError } from "graphql";
import { API_telefono } from "./types.ts";

` `

const API_KEY=Deno.env.get("API_KEY")

export const validarTelefono=async(phone:string)=>{
    if(!API_KEY) throw new Error("Error en coger la api key")

        const data=await fetch(`https://api.api-ninjas.com/v1/validatephone?number=${phone}`,{
            headers:{
                'X-Api-Key': API_KEY
            }
        })
        if(data.status!==200) throw new GraphQLError("Error en coger los datos de la api telefono")

        const result:API_telefono= await data.json()

        return{
            is_valid: result.is_valid,
            country: result.country
           
        }

}

