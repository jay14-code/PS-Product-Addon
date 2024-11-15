import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { Form, useFetcher, useNavigate } from "@remix-run/react";
import {
  Page,
  Text,
  Button,
  BlockStack,
  Card,
  TextField,
  Tag,
  DataTable
} from "@shopify/polaris";;
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
      if (responseJson.errors) {
        console.error("GraphQL Errors:", responseJson.errors);
      }
      const products = responseJson.data.products.edges.map(edge => edge.node);
      allProducts = allProducts.concat(products);
      hasNextPage = responseJson.data.products.pageInfo.hasNextPage;

      cursor = hasNextPage ? responseJson.data.products.edges[products.length - 1].cursor : null;
    }

    return json({ products: allProducts });
  } else if (actionType === "saveProduct") {
    // Extracting values directly from formData
    const masterProduct = formData.get("masterProduct");
    const addons = formData.get("addons");
  
    await prisma.ProductAddons.create({
      data: {
        masterProduct: masterProduct,
        addons: addons,
        shop,
      },
    });
  
    return json({ masterProduct: masterProduct, addons: addons });
  }
  
  

  return json({ error: "Invalid action type" }, { status: 400 });
};

function Productfetch() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [masterProduct, setMasterProduct] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState(false);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [searchAddonTerm, setSearchAddonTerm] = useState('');
  const [selectedAddonProducts, setSelectedAddonProducts] = useState([]);
  const [addonProducts, setAddonProducts] = useState([]);

  // useEffect(() => {
  //   if (fetcher.data?.products) {
  //     setProducts(fetcher.data.products);
  //     // console.log(products);
  //   }
  // }, [fetcher.data]);
  fetcher.data?.products && console.log("Fetched Products:", fetcher.data.products);

  useEffect(() => {
    if (fetcher.data?.products) {
      setProducts(fetcher.data.products);
    } else if (fetcher.error) {
      console.error("Error fetching data:", fetcher.error);
    }
  }, [fetcher.data, fetcher.error]);


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
    setShowOptions(true);
    handleFetchProducts();
  };

  const handleProductSelect = (product) => {
    setMasterProduct(product);
    setSearchTerm(product.title);
    setSelectedMaster(true);
    setShowOptions(true);
    setIsProductSelected(true); 
  };

  const handleAddonProductSelect = (product) => {
    setAddonProducts([...addonProducts, product]);
    setSelectedAddonProducts(prevSelected => {
      if (prevSelected.includes(product.id)) {
        return prevSelected.filter(id => id !== product.id);
      } else {
        return [...prevSelected, product.id];
      }
    });
  };

  const handleRemoveAddonProduct = (productId) => {
    setSelectedAddonProducts(prevSelected => prevSelected.filter(id => id !== productId));
  };

  const handleSave = async () => {
    console.log(masterProduct);
    console.log(addonProducts);
    
    await fetcher.submit(
      {
        actionType: "saveProduct",
        masterProduct: JSON.stringify(masterProduct),
        addons: JSON.stringify(addonProducts),
      },
      { method: "POST" }
    );
    alert("Product is saved!");
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
      !selectedAddonProducts.includes(product.id) // Exclude selected addon products
    );
  });

  return (
    <Form method="POST"> 
    <Page title="Create Product Addon" 
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

        {showOptions && (
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
                {selectedAddonProducts.map(productId => {
                  const product = products.find(p => p.id === productId);
                  return (
                    product && (
                      <Tag key={product.id} onRemove={() => handleRemoveAddonProduct(product.id)}>
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
                      style={{ display: 'flex', alignItems: 'center', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: selectedAddonProducts.includes(product.id) ? '#e6f7ff' : 'transparent' }}
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
        )}
      </BlockStack>
      {showOptions && (
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
          rows={selectedAddonProducts.map(productId => {
            const product = products.find(p => p.id === productId);
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
      )}
      
    </Page>
    </Form>
  );
}

export default Productfetch;
