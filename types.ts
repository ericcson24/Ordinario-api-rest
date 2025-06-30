import { OptionalId } from "mongodb";


export type Usuario=OptionalId<{
    name:string,
    phone:string,
   
    direction:string,
    city:string,
    country:string
}>

export type API_telefono={
    is_valid:boolean,
    country:string
  
}

