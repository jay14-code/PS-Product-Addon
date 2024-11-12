import {
    Card,
    Layout,
    Page,
    Text,
    BlockStack,
    TextField,
    Button,
  } from "@shopify/polaris";
  import { Form, json, useLoaderData } from "@remix-run/react";
  import { TitleBar } from "@shopify/app-bridge-react";
  import { useState } from 'react';
  import prisma from "../db.server";
  import { authenticate } from "../shopify.server";
  

  export async function loader({ request }) {
    const { session } = await authenticate.admin(request);
    
    let settings = await prisma.settings.findFirst({
      where: {
        shop: session.shop,
      },
    });
    if (!settings) {
      settings = {};
    }
  
    // provides data to the component
    return json(settings);
  };

  export async function action({ request }) {
    // updates persistent data
    let settings = await request.formData();
  
    settings = Object.fromEntries(settings);
    const { session } = await authenticate.admin(request);
  
    // Database Update ....
  
    await prisma.settings.upsert({
      where: { shop: session.shop },
      update: {
        tab1: settings.tab1,
        tab2: settings.tab2,
        shop: session.shop,
      },
      create: {
        tab1: settings.tab1,
        tab2: settings.tab2,
        shop: session.shop,
      },
    });
  
    return json(settings);
  };

  export default function Settings() {
    const settings = useLoaderData();
    const [formState, setFormState] = useState(settings);
    //   console.log(settings);
    return (
      <Page>
        <TitleBar title="Settings" />
        <Layout>
        
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
              <Text variant="headingSm">Choose Set</Text>
              <Form method="POST">
                  <Layout.Section>
          </Layout.Section>
                <TextField
                  label="Tab 1"
                  name="tab1"
                  value={formState?.tab1}
                  onChange={(value) =>
                    setFormState({ ...formState, tab1: value })
                  }
                  autoComplete="off"
                />
                <TextField
                  label="Tab 2"
                  name="tab2"
                  value={formState?.tab2}
                  onChange={(value) =>
                    setFormState({ ...formState, tab2: value })
                  }
                  autoComplete="off"    
                />
                <Button submit={true}>Save Data</Button>
              </Form>
              </BlockStack>
            </Card>
          </Layout.Section>
          
        </Layout>
      </Page>
    );
  };
 