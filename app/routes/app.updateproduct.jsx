import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { Form,useFetcher, useLocation, useNavigate } from "@remix-run/react";
import {
  Page,
  Text,
  Button,
  BlockStack,
  Card,
  TextField,
  Tag,
  DataTable
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType"); // Determine the action type

  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  if (actionType === "fetchProducts") {
    // Handle fetching products
    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;

    const { admin } = await authenticate.admin(request);

    while (hasNextPage) {
      const response = await admin.graphql(
        `#graphql
        query($cursor: String) {
          products(first: 250, after: $cursor) {
            edges {
              node {
                id
                title
                handle
                vendor
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      sku
                      inventoryQuantity
                    }
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      originalSrc
                      altText
                    }
                  }
                }
                featuredImage {
                  originalSrc
                  altText
                }
                options {
                  name
                  values
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }`,
        { variables: { cursor } }
      );

      const responseJson = await response.json();
      const products = responseJson.data.products.edges.map(edge => edge.node);
      allProducts = allProducts.concat(products);
      hasNextPage = responseJson.data.products.pageInfo.hasNextPage;

      cursor = hasNextPage ? responseJson.data.products.edges[products.length - 1].cursor : null;
    }

    return json({ products: allProducts });
  } else if (actionType === "updateProduct") {
    // Extracting values directly from formData
    const id = parseInt(formData.get("id"), 10);
    const masterProduct = formData.get("masterProduct");
    const addons = formData.get("addons");
  
    const existingProduct = await prisma.ProductAddons.findUnique({
      where: { id: id, shop: shop },        // Ensure the product belongs to the current shop
    });

    if (!existingProduct) {
      return json({ error: "Product not found or unauthorized access" }, { status: 404 });
    }

    // Update the existing product with the new data
    const updatedProduct = await prisma.ProductAddons.update({
      where: { id: id, shop: shop },        // Find the specific product by ID and shop
      data: {
        masterProduct: masterProduct,       // Update the master product details
        addons: addons,                     // Update the addons
      },
    });
  
    return json({ masterProduct: updatedProduct.masterProduct, addons: updatedProduct.addons });
  }
  
  

  return json({ error: "Invalid action type" }, { status: 400 });
};

function UpdateProduct() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = location.state || {};
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [masterProduct, setMasterProduct] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState(false);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [searchAddonTerm, setSearchAddonTerm] = useState('');
  const [addonProducts, setAddonProducts] = useState([]);
  const [updateId,setUpdateId]= useState(null);

  useEffect(() => {
    // console.log('Location state:', location); // Debugging line
    handleFetchProducts();
    // console.log(data ? JSON.stringify(data) : 'No data available');
    const dataId = data ? JSON.stringify(data.id) : 'No dataid available';
    if (data) {
      const MasterProduct = JSON.parse(data.masterProduct);
      const Addons = JSON.parse(data.addons);
      
      // console.log('update id===',dataId);
        setUpdateId(dataId);
        setMasterProduct(MasterProduct);
        setSearchTerm(MasterProduct.title);
        setSelectedMaster(true);
        setIsProductSelected(true);
        
        // console.log(Addons);
        setAddonProducts(Addons);

        // console.log('test',addonProducts)
    }
  }, [data]);

  useEffect(() => {
    if (fetcher.data?.products) {
      setProducts(fetcher.data.products);
      // console.log(products);
    }
  }, [fetcher.data, shopify]);

  const handleFetchProducts = async () => {
    setIsLoading(true);
    await fetcher.submit({ actionType: "fetchProducts" }, { method: "POST" });
    setIsLoading(false);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    handleFetchProducts();
  };

  const handleAddonChange = (value) => {
    setSearchAddonTerm(value);
    handleFetchProducts();
  };

  const handleProductSelect = (product) => {
    setMasterProduct(product);
    setSearchTerm(product.title);
    setSelectedMaster(true);
    setIsProductSelected(true); 
  };

  const handleAddonProductSelect = (product) => {
    setAddonProducts([...addonProducts, product]);
  };

  const handleRemoveAddonProduct = (product) => {
    setAddonProducts(prevProducts => prevProducts.filter(item => item.id !== product.id));
  };

  const handleSave = async () => {
    // console.log(updateId);
    // console.log(masterProduct);
    // console.log(addonProducts);
    
    await fetcher.submit(
      {
        actionType: "updateProduct",
        id: updateId,
        masterProduct: JSON.stringify(masterProduct),
        addons: JSON.stringify(addonProducts),
      },
      { method: "POST" }
    );
    alert("Product is updated sucessfully!");
    navigate('/app/addonlist', { state: { reload: true } });
  };


  const filteredProducts = products.filter(product => {
    const isSearchTermEmpty = searchTerm.trim() === '';
    
    return (
      (!isSearchTermEmpty && product.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const filteredAddonProducts = products.filter(product => {
    const isSearchTermEmpty = searchAddonTerm.trim() === '';
    
    return (
      (!isSearchTermEmpty && product.title.toLowerCase().includes(searchAddonTerm.toLowerCase())) &&
      (!masterProduct || product.id !== masterProduct.id) && // Exclude master product
      !addonProducts.some(addon => addon.id === product.id) // Exclude selected addon products
    );
  });

  return (
    <Form method="POST"> 
    <Page title="Update Product Addon" 
      primaryAction={
        <Button variant="primary" onClick={handleSave} loading={isLoading}>
         Save
        </Button>
      }
      >
      <BlockStack>
          <Card>
            <BlockStack>
            <Text variant="headingSm" as="h6">Master Product</Text>
              <TextField
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Enter master product title..."
                autoComplete="off"
                disabled={isProductSelected}
              />
              {!selectedMaster && filteredProducts.length > 0 && (
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      style={{ display: 'flex', alignItems: 'center', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onClick={() => handleProductSelect(product)}
                    >
                      {product.images.edges.length > 0 && (
                        <img 
                          src={product.images.edges[0].node.originalSrc} 
                          alt={product.images.edges[0].node.altText} 
                          style={{ width: '30px', height: '30px', marginRight: '10px' }} 
                        />
                      )}
                      <Text>{product.title}</Text>
                    </div>
                  ))}
                </div>
              )}
            </BlockStack>
            <BlockStack>
            <DataTable
                columnContentTypes={[
                  'text',
                  'image',
                ]}
                headings={[
                ]}
                rows={masterProduct ? [
                  [
                    masterProduct.title,
                    masterProduct.images.edges.length > 0 ? (
                      <img 
                      src={masterProduct.images.edges[0].node.originalSrc} 
                      alt={masterProduct.images.edges[0].node.altText} 
                      style={{ width: '50px', height: '50px' }} 
                      />
                      ) : null
                    ]
                  ] : []}
              />
            </BlockStack>
          </Card>

          <Card>
            <BlockStack>
            <Text variant="headingSm" as="h6">Addon Products</Text>
              <TextField
                value={searchAddonTerm}
                onChange={handleAddonChange}
                placeholder="Enter addon product title..."
                autoComplete="off"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '10px' }}>
                {addonProducts.map(product => {
                  // const product = products.find(p => p.id === productId);
                  return (
                    product && (
                      <Tag key={product.id} onRemove={() => handleRemoveAddonProduct(product)}>
                        {product.title}
                      </Tag>
                    )
                  );
                })}
              </div>
              {filteredAddonProducts.length > 0 && (
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredAddonProducts.map(product => (
                    <div 
                      key={product.id} 
                      style={{ display: 'flex', alignItems: 'center', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: addonProducts.includes(product) ? '#e6f7ff' : 'transparent' }}
                      onClick={() => handleAddonProductSelect(product)}
                    >
                      {product.images.edges.length > 0 && (
                        <img 
                          src={product.images.edges[0].node.originalSrc} 
                          alt={product.images.edges[0].node.altText} 
                          style={{ width: '30px', height: '30px', marginRight: '10px' }} 
                        />
                      )}
                      <Text>{product.title}</Text>
                    </div>
                  ))}
                </div>
              )}
            </BlockStack>
          </Card>
      </BlockStack>
       <Card>
        <DataTable
          columnContentTypes={[
            'text',
            'image',
          ]}
          headings={[
            <Text variant="headingSm" as="h6">Addon Name</Text>,
            <Text variant="headingSm" as="h6">Image</Text>,
          ]}
          rows={addonProducts.map(product => {
            // const product = products.find(p => p.id === productId);
            return product ? [
              product.title,
              product.images.edges.length > 0 ? (
                <img 
                  src={product.images.edges[0].node.originalSrc} 
                  alt={product.images.edges[0].node.altText} 
                  style={{ width: '50px', height: '50px' }} 
                />
              ) : null
            ] : [];
          })}
        />
      </Card>
      
    </Page>
    </Form>
  );
}

export default UpdateProduct;
