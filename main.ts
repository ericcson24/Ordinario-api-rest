// deno-lint-ignore-file
import { MongoClient,ObjectId } from 'mongodb'
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { validarTelefono } from "./resolvers.ts";
import { Usuario } from "./types.ts";





const MONGO_URL= Deno.env.get("MONGO_URL")
if(!MONGO_URL) throw new Error ("Error al coger la clave de mongo db")

const client = new MongoClient(MONGO_URL)
await client.connect()
console.log("Cliente conectado a mongo")

const db=client.db("EjercicioUsuarios")
const UsuarioCollection=db.collection<Usuario>("Usuario")




const handler= async (req:Request):Promise<Response>=>{
  const url= new URL(req.url)
  const method= req.method
  const path= url.pathname
  const searchParams = url.searchParams

  if (method==="GET"){

    if(path==="/usuario"){
       //cogemos el id de al consulta
      const id=searchParams.get("id")
        if(!id)throw new Response("No hay id",{status:404})

      //buscamos el id en la coleccion
      const args= await UsuarioCollection.findOne({_id:new ObjectId(id)})
        if(!args) throw new Response("No hay restaurantes con el id",{status:404})

      //si lo encontramos, devolvemos
      return new Response( JSON.stringify({
        id: args._id?.toString(),
        name: args.name,
        phone:args.phone,
        direction:args.direction,
        city:args.city,
        country:args.country
      }))
      
    }


  }else if(method==="POST"){

    if(path==="/usuario"){
      const args:Usuario = await req.json()

      //que estas obligado a poner
      const CamporRequeridos:(keyof Usuario)[]=["name","direction","city","phone"]

      //ver a ver si tienes los requeridos
      const faltantes= CamporRequeridos.filter(e=>!args[e])
      if(faltantes.length>0) return new Response("no has introducido todos los datos",{status:404})

      
      //validar telefono
      const{is_valid,country}=await validarTelefono(args.phone)
      if(!is_valid)throw new Response("telefono no valido")

      //ver si esta el telefono en la base de datos

      const telefono_yaesta= await UsuarioCollection.findOne({phone:args.phone})
      if(telefono_yaesta) throw new Response("El teleofno ya estaba")

      //insertamos
      const {insertedId}= await UsuarioCollection.insertOne({
        name:args.name,
        phone:args.phone,
      
        direction:args.direction,
        city:args.city,
        country:country
      })

      //mostramos
      return new Response(JSON.stringify({
        id:insertedId,
        phone:args.phone,
      
        direction:args.direction,
        city:args.city,
        country:country

      })

      )
    }

  }else if(method==="PUT"){
    if (path==="/"){}
  }


  return new Response("Bad request",{status:400})
}
Deno.serve({port:3000}, handler)
