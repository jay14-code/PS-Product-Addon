import { 
  Card,
  Page,
  DataTable, 
  Button,
  Frame, 
  Modal, 
  Text,
  Tooltip,
  Icon,
  InlineStack,
} from '@shopify/polaris';
import prisma from "../db.server";
import { useState, useCallback } from "react";
import { json, useLoaderData, useFetcher,useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  ListBulletedFilledIcon,
  DeleteIcon,
  EditIcon,
  XIcon
} from '@shopify/polaris-icons';

// Loader function to fetch data
export async function loader({ request }) {
   const { session } = await authenticate.admin(request);
   
   const ProductAddons = await prisma.ProductAddons.findMany({
     where: {
       shop: session.shop,
     },
   });
 
   return json(ProductAddons);
}

// Action function to handle create, update, and delete actions
export async function action({ request }) {
  let formData = await request.formData();
  formData = Object.fromEntries(formData);
  const { session } = await authenticate.admin(request);

  const masterProductId = formData.masterProductId;
  const shop = session.shop;
  const actionType = formData.actionType;

  const id = parseInt(formData.id, 10); 

  if (isNaN(id)) {
      return json({ success: false, message: 'Invalid ID provided for deletion.' });
  }

  if (actionType === 'delete') {
      const existingProductAddon = await prisma.ProductAddons.findUnique({
          where: { 
              id: id, 
              shop: shop
          },
      });

      if (existingProductAddon) {
          await prisma.ProductAddons.delete({
              where: { id },
          });
          return json({ success: true, message: 'Product addon deleted successfully.' });
      } else {
          return json({ success: false, message: 'No product addon found to delete.' });
      }
  } 
  

  return json(formData);
}

// Addon List Component
function Addonlist() {
   const ProductAddons = useLoaderData();
   const navigate = useNavigate();
   const [formState, setFormState] = useState(ProductAddons || []);
   const [active, setActive] = useState(false);
   const [selectedAddons, setSelectedAddons] = useState(null);
   const [deleteActive, setDeleteActive] = useState(false);
   const [selectedAddonToDelete, setSelectedAddonToDelete] = useState(null);
   
   const fetcher = useFetcher();

   const handleChange = useCallback(() => setActive(!active), [active]);

   const handleViewSelect = (addon) => {
       const addonsProduct = JSON.parse(addon.addons);
       setSelectedAddons(addonsProduct);
       handleChange();
   };

  const handleEditSelect = (data) => {
    console.log('redirect with', data)
    navigate('/app/updateproduct', { state: { data } });
  };
  
   const handleDeleteSelect = (id) => {
       setSelectedAddonToDelete(id);
       setDeleteActive(true);
   };

   const handleDeleteConfirm = async () => {
       const result = await fetcher.submit(
           {
               actionType: 'delete',
               id: selectedAddonToDelete,
           },
           { method: 'POST' }
       );
  
        // Update the state after deletion
        const updatedAddons = formState.filter(addon => addon.id !== selectedAddonToDelete);
        setFormState(updatedAddons);
        setDeleteActive(false); 
   };

   
   const handleDeleteCancel = () => {
       setDeleteActive(false);
   };



   // Prepare rows for the DataTable
   const rows = formState.map(addon => {
       let productDetails;
       try {
           const masterProduct = JSON.parse(addon.masterProduct);
           const imageSrc = masterProduct?.images?.edges?.[0]?.node?.originalSrc || '';
           const title = masterProduct?.title || 'No title available';
 
           return [
               <img src={imageSrc} alt={title} style={{ width: '50px', height: '50px' }} />,
               title,
               <span>Active</span>,
               <InlineStack gap="400" wrap={false} blockAlign="center">
                   <Tooltip content="View Product" dismissOnMouseOut>
                        <Button onClick={() => handleViewSelect(addon)} >
                          <Icon source={ListBulletedFilledIcon} tone="base"/>
                        </Button>
                   </Tooltip>
                   <Tooltip content="Edit Product" dismissOnMouseOut>
                       <Button onClick={() => handleEditSelect(addon)} >
                         <Icon source={EditIcon} tone="base"/> 
                       </Button>
                   </Tooltip>
                   <Tooltip content="Delete Product" dismissOnMouseOut>
                       <Button onClick={() => handleDeleteSelect(addon.id)} >
                         <Icon source={DeleteIcon} tone="base"/> 
                       </Button>
                   </Tooltip>
               </InlineStack>,
           ];
       } catch (error) {
           console.error("Error parsing master product details:", error);
           return [
               null,
               "Invalid master product data",
               addon.createdAt,
               null,
           ];
       }
   });

   // Prepare rows for the modal DataTable (Addons list)
   const addonRows = selectedAddons
       ? selectedAddons.map((addon, index) => [
           <img src={addon?.images?.edges?.[0]?.node?.originalSrc} alt={addon?.title} style={{ width: '50px', height: '50px' }} />,
           addon.title
       ])
       : [];


   return (
       <Page title="Product Addons">
           <Card>
               <DataTable
                   columnContentTypes={['image', 'text', 'text', 'text']}
                   headings={['Image', 'Master Product Name', 'Status', 'Actions']}
                   rows={rows}
               />
           </Card>
           <div>
               <Frame>
                   <Modal
                       open={active}
                       onClose={handleChange}
                       title="View Addon Products"
                       primaryAction={{
                           content: 'Close',
                           onAction: handleChange,
                       }}
                   >
                       <Modal.Section>
                           <Text>
                               Below is the list of addon products for the selected master product.
                           </Text>
                           <DataTable
                               columnContentTypes={[ 'image', 'text']}
                               headings={[ 'Image', 'Title']}
                               rows={addonRows}
                           />
                       </Modal.Section>
                   </Modal>
               </Frame>
           </div>
           {/* Custom Delete Confirmation Modal */}
           <Frame>
               <Modal
                   open={deleteActive}
                   onClose={handleDeleteCancel}
                   title="Delete Product Addon"
                   primaryAction={{
                       content: 'Delete',
                       onAction: handleDeleteConfirm,
                   }}
                   secondaryActions={[
                       {
                           content: 'Cancel',
                           onAction: handleDeleteCancel,
                       },
                   ]}
               >
                   <Modal.Section>
                       <Text>
                           Are you sure you want to delete this product addon? This action cannot be undone.
                       </Text>
                   </Modal.Section>
               </Modal>
           </Frame>
       </Page>
   );
}

export default Addonlist;
