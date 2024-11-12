import { json } from "@remix-run/node";
import db from "../db.server";
import { cors } from "remix-utils/cors";


export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");


  if (!shop) {
    return json({
      message: "Missing data. Required data: shop",
      method: "GET",
    });
  }

  const addondata = await db.Settings.findMany({
    where: {
      shop: shop,
    },
  });

  const response = json({
    ok: true,
    message: "Success",
    data: addondata,
  });

  return cors(request, response);
}




export async function action({ request }) {
    const data = await request.formData();
    const shop = data.get("shop");
    const _action = data.get("_action");
  
    if (!shop || !_action) {
      return json({
        message: "Missing data. Required data: shop, _action",
        method: _action,
      });
    }
  
    let response;
  
    switch (_action) {
      case "PATCH":
        // Handle PATCH request logic here
        return json({ message: "Success", method: "PATCH" });
  
      case "DELETE":
        // Handle DELETE request logic here
        response = json({ message: "Product removed", method: _action });
        return cors(request, response);
  
      default:
        return new Response("Method Not Allowed", { status: 405 });
    }
  }









