import {MongoClient, ObjectId} from "mongodb"
import { Restaurante, RestauranteSimple } from "./types.ts";
import { vaidatephone,getLatLong,getTemperatura } from "./utils.ts";



const MONGO_URL = Deno.env.get("MONGO_URL")

if(!MONGO_URL) throw new Error("Error con MONGO_URL")

const client = new MongoClient(MONGO_URL)
await client.connect()
console.log("Conectado a MONGO_URL")


const db = client.db("Restaurantes")
const LocalCollection= db.collection<Restaurante>("restaurante")

//una vezhecha la base de datos empezamos a hacer los casos
const handler =async(req:Request):Promise<Response>=>{
  //esto siempre ponerlo
  const url = new URL(req.url)
  const method = req.method
  const path = url.pathname
  const searchParams = url.searchParams


  //vamos con las llamadas

  //get
  if(method==="GET"){

    //dentro de los gets, puede hacber diferentes cosas que quieras hacr get
    if(path ==="/restaurant"){

      //cogemos el id de al consulta
      const id=searchParams.get("id")
        if(!id)throw new Response("No hay id",{status:404})

      //buscamos el id en la coleccion
      const local= await LocalCollection.findOne({_id:new ObjectId(id)})
        if(!local) throw new Response("No hay restaurantes con el id",{status:404})

      //si lo encontramos, devolvemos
      return new Response( JSON.stringify({
        id: local._id?.toString(),
        name: local.name
        
      }))

    }
    else if(path==="/restaurants"){
      //cogemos la ciudad de al consulta
      const city=searchParams.get("city")
        if(!city)throw new Response("No hay city",{status:404})

      //cogemos todos los restaurantes
      const restaurantes = await LocalCollection.find({city}).toArray()
        if(restaurantes.length === 0) return new Response("No hay restaurantes en esa ciudad", {status:404})

      //mostramos de manera simplificada los locales, de ahi que haya tipes de restaurantes frente a restaurante
      const restaurantesEnCiudad:RestauranteSimple[]=await Promise.all(restaurantes.map(async(e)=>
      ({
        id: e._id?.toString(),
        name: e.name,
        direction_full: `${e.direction}, ${e.city}, ${e.country}`,
        phone: e.phone,
        temperature: await getTemperatura(e.latitude, e.longitude),
      }) ))

       return new Response(JSON.stringify(restaurantesEnCiudad))

    }



  //post
  }else if(method==="POST"){

    //cogemo la estructura de restaurante
    const body:Restaurante =await req.json()

    //que estas obligado a coger
    const CamporRequeridos:(keyof Restaurante)[]=["name","direction","city","phone"]

    //ver a ver si tienes los requeridos
    const faltantes= CamporRequeridos.filter(e=>!body[e])
      if(faltantes.length>0) return new Response("no has introducido todos los datos",{status:404})
    
    //vamos con las apis

      //validar telefono
      const{is_valid,country}=await vaidatephone(body.phone)
        if(!is_valid)throw new Response("telefono no valido")

      //coger la latitud y long
      const {latitude,longitude}=await getLatLong(body.city)

    
    //consulta para ver si ya esta en la base de datos
    const ya_esta= await LocalCollection.findOne({phone:body.phone})
      if(ya_esta)throw new Response("Ya esta en la base de datos, coge otro telefono")
    
    //insertamos y mostramos
       const { insertedId } = await LocalCollection.insertOne({
      name: body.name,
      direction: body.direction,
      city: body.city,
      phone: body.phone,
      country,
      latitude,
      longitude
    })

    return new Response(JSON.stringify({
      id: insertedId,
      name: body.name,
      direction: body.direction,
      city: body.city,
      phone: body.phone
    }))

      
  
    }else if(method==="PUT"){
      //no te pide nada en este ejercicio, sin embargo, quiero hacerlo
      // TODO: Implementar PUT
      return new Response("PUT not implemented", {status:501})
  
      //delete
  }else if(method==="DELETE"){
      // TODO: Implementar DELETE  
      return new Response("DELETE not implemented", {status:501})
  }


  return new Response("Bad request",{status:400})

}

Deno.serve({port:3000}, handler)