import { 
  Card,
  Page,
  Icon,
  InlineStack,
  EmptyState,
} from '@shopify/polaris';
import { useNavigate } from "@remix-run/react";
import {
  PlusIcon,
} from '@shopify/polaris-icons';

export default function Index() {
  const navigate = useNavigate();

  const handlecreateAddon = () => {
    navigate('/app/productfetch');
   };

  return (
    <Page title="App" >
      <Card sectioned>
                <EmptyState
                heading="You don't have any addons yet"
                action={{
                    content: ( <InlineStack align="center"> <Icon source={PlusIcon} tone="base" /> Create Addon </InlineStack>),
                    onClick: handlecreateAddon,
                }}
                secondaryAction={{
                    content: 'Learn more',
                    url: '',
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                <p>You can create unlimited product addons.</p>
                </EmptyState>
            </Card>
    </Page>
  );
}
