document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.includes('/products/')) {
        const contain = document.getElementById('jay-developer');
        const shopDomain= contain.getAttribute('data-shop-domain');
        const form = document.querySelector('form[action="/cart/add"] button[type="submit"]');
        const appUrl = 'https://ps-product-addon.onrender.com/';

        //input for unique id in main product
        const newInput = document.createElement('input');
        newInput.type = 'hidden';
        newInput.id = 'PS-groupid'; 
        newInput.name = 'properties[PSProductAddonid]';
        newInput.value = '';

        form.parentNode.insertBefore(newInput, form);
        
        // Function to fetch initial data
        function init() {
            const url = `${appUrl}api/addonsproduct?shop=${shopDomain}`;
            // alert(url);
            
            fetch(url)
            .then((response) => response.json())
            .then((result) => {
                if (result.ok && result.data.length > 0) {
                    appdata(result.data);
                    updateUI(result.data);
                } else {
                    console.error('No data found or an error occurred.');
                }
            })
            .catch((error) => console.log('error', error));
        }

        // Function to handle the app data
        function appdata(data){
            for (let i = 0; i < data.length; i++) {
                const product = JSON.parse(data[i].masterProduct);
                // console.log(product.handle);
                if (window.location.pathname.includes(product.handle)) {
                    if (contain && form) {
                        const parentForm = form.closest('form');
                        parentForm.appendChild(contain); 
                        contain.style.display = 'block'; 
                        // form.classList.add('psAddon-submit-button');
                    }
                }
            }
                    
        }

        // Function to update the UI with fetched data
        function updateUI(data) {
          // console.log(data);
            for (let i = 0; i < data.length; i++) {
                const product = JSON.parse(data[i].masterProduct);
                // console.log(product.handle);
                
                if (window.location.pathname.includes(product.handle)) {
                    // const mainproduct = product.id;
                    // console.log(mainproduct);
                    const addonsproducts = JSON.parse(data[i].addons);
                    // console.log(addonsproducts);
            
                    const drawer = document.createElement('div');
                    drawer.classList.add('PS-custom-Drawer');

                    // Create the close button
                    const closeButton = document.createElement('div');
                    closeButton.classList.add('drawer-close');
                    closeButton.textContent = 'X'; 

                    closeButton.addEventListener('click', () => {
                        drawer.style.display = 'none';
                    });
                
                    // Create the content paragraph
                    const contentParagraph = document.createElement('p');
                    contentParagraph.id = 'drawer-content-free';
                    contentParagraph.textContent = 'Choose your Addon Here';

                    // Create the inner content section
                    const chooseSetOptionOne = document.createElement('div');
                    chooseSetOptionOne.classList.add('choose_set_option_one');

                    // Create the drawer product picker container
                    const productPicker = document.createElement('div');
                    productPicker.classList.add('drawer-product-picker');
                    productPicker.id = 'ps-drawer';

                    // Append elements to the correct hierarchy
                    chooseSetOptionOne.appendChild(productPicker);
                    drawer.appendChild(closeButton);
                    drawer.appendChild(contentParagraph);
                    drawer.appendChild(chooseSetOptionOne);

                    // Append the entire drawer to the body
                    document.body.appendChild(drawer);
        
            
                    for (let j = 0; j < addonsproducts.length; j++) {
                        const addon = addonsproducts[j];
                        // console.log(addon);
                        const psvariantQuantity = addon.variants.edges[0].node.inventoryQuantity;
                        
                        const imgsrc = addon.featuredImage.originalSrc;
                        const imagAlt = addon.featuredImage.altText;
                        const addonid = addon.id.split('/').pop();
                        
                        // create main div
                        const maindiv = document.createElement('div');
                        maindiv.classList.add('Ps-AddonProduct-item');
                        maindiv.setAttribute('id', 'Ps_AddonProduct_item_' + addonid);
                        if (psvariantQuantity <= 0 || psvariantQuantity == undefined) {
                            maindiv.classList.add('Ps-disable');
                         }
                          
            
                        // create image div
                        const imgdiv = document.createElement('div');
                        imgdiv.classList.add('Ps-AddonProduct-image');
                        
                        const img = document.createElement('img');
                        img.src = imgsrc || '/'; 
                        img.alt = imagAlt;
                        img.width = 100;
                        img.height = 100;
            
                        imgdiv.appendChild(img);
            
                        // create checkbox div
                        const checkboxdiv = document.createElement('div');
                        checkboxdiv.classList.add('Ps-AddonProduct-checkbox');
            
                        const checkBox = document.createElement('input');
                        checkBox.type='checkbox';
                        checkBox.name ='PS_productid';
                        checkBox.setAttribute('handle', addon.handle);
                        checkBox.id ='checkbox_'+addonid;
                        checkBox.value = addonid;
            
                        checkboxdiv.appendChild(checkBox);
            
            
                        // create title div
                        const titlediv = document.createElement('div');
                        titlediv.classList.add('Ps-AddonProduct-title');
            
                        const title = document.createElement('a');
                        title.href='/products/'+ addon.handle;
                        title.target= '_blank';
                        title.innerHTML= addon.title;
            
                        titlediv.appendChild(title);
            
                        // create variantid input
                        const psvariantid = addon.variants.edges[0].node.id.split('/').pop();
            
                        const variantinput = document.createElement('input');
                        variantinput.type = 'hidden';
                        variantinput.name = 'ps_selected_variant_id';
                        variantinput.value = psvariantid;
                        variantinput.setAttribute('quantity', psvariantQuantity);
            
                        // create quantity input
            
                        const quantityinput = document.createElement('input');
                        quantityinput.type = 'hidden';
                        quantityinput.id = 'ps_Addon_quantity';
                        quantityinput.name = 'ps_selected_variant_quantity';
                        quantityinput.value = '1';
            
                        // create price div
            
                        
                        maindiv.appendChild(imgdiv);
                        maindiv.appendChild(titlediv);
                        maindiv.appendChild(variantinput);
                        maindiv.appendChild(quantityinput);

                        productPicker.appendChild(maindiv);
                    }
                }
    
            }

            // Function to generate product picker options based on nlimit
            function generateProductPickerOptions(limit) {
              const productPickerContainer = document.getElementById('product-picker-options');
              productPickerContainer.innerHTML = ''; // Clear existing options
      
              for (let i = 1; i <= limit; i++) {
              // Create a new product picker column for each addon
              const pickerCol = document.createElement('div');
              pickerCol.classList.add('product-picker-col');
              pickerCol.setAttribute('choose_set', `choose${limit}_set_${i}`);
              pickerCol.setAttribute('p_text', `Color${limit} 0${i}`);
      
              // Create the product picker div inside the column
              const pickerDiv = document.createElement('div');
              pickerDiv.classList.add('product-picker');
              pickerDiv.setAttribute('id', `Colore-limit${limit}_${i}`);
              pickerDiv.style.border = '1px solid rgb(158, 158, 158)';
      
              // Add plus icon inside the picker
              const plusIcon = document.createElement('span');
              plusIcon.classList.add('product-picker-plus-icon');
              plusIcon.classList.add(`product-icon-picker-limit${limit}_${i}`);
              plusIcon.innerHTML = `<svg class="" width="13" height="13" viewBox="0 0 10 10" fill="none">
                                      <path d="M5 0.5V9.5M9.5 5H0.5" stroke="#121212" stroke-linecap="round" stroke-linejoin="round"></path>
                                      </svg>`;
      
              pickerDiv.appendChild(plusIcon);
      
              // Add image placeholder inside the picker
              const image = document.createElement('img');
              image.setAttribute('id', `selectedImage-limit${limit}_${i}`);
              image.setAttribute('src', '/');
              image.setAttribute('alt', 'Selected Image');
              image.setAttribute('width', '190px');
              image.setAttribute('height', '190px');
              image.style.display = 'none';
      
              pickerDiv.appendChild(image);
      
              // Create the hidden input field
              const input = document.createElement('input');
              input.setAttribute('type', 'hidden');
              input.setAttribute('id', `ps${limit}-choosedID${i}`);
              input.setAttribute('name', 'ps_choosed_variant_id');
              input.setAttribute('value', '');
      
              pickerCol.appendChild(pickerDiv);
              pickerCol.appendChild(input);
      
              // Append the new picker column to the container
              productPickerContainer.appendChild(pickerCol);
              }
      
      
              // Handle opening of the drawer and selecting an image
              const buttons = document.querySelectorAll('.product-picker-col');
              const buttonClose = document.querySelector('.drawer-close');
      
              buttons.forEach((button, index) => {
                  button.addEventListener('click', function() {
                      document.querySelector('.PS-custom-Drawer').style.display = 'block';
                      const selectedImage = document.querySelector(`#selectedImage-limit${limit}_${index + 1}`);
                      const pickerInput = document.querySelector(`#ps${limit}-choosedID${index+1}`);
                      const currentPicker = document.querySelector(`.product-icon-picker-limit${limit}_${index + 1}`);
                      selectedImage.setAttribute('src', '/');
                      selectedImage.style.display = 'none';
                      pickerInput.setAttribute('value', '');
                      currentPicker.style.display = 'flex';
                      const items = document.querySelectorAll(".Ps-AddonProduct-item");
          
                      items.forEach((item) => {
                          item.addEventListener('click', function() {
                              const selectedImageSrc = item.querySelector('.Ps-AddonProduct-image img').src;
                              const productId = item.querySelector('.Ps-AddonProduct-item input[name="ps_selected_variant_id"]').value;
                                 
                              if (currentPicker) {
                                  currentPicker.style.display = 'none';
                              }
          
                              if (selectedImage.src == `https://${shopDomain}/`) {
                              selectedImage.setAttribute('src', selectedImageSrc);
                              selectedImage.style.display = 'block';
                              }
          
                              
                              if (pickerInput.value == '') {
                                  pickerInput.setAttribute('value', productId);
                              }
                              
                              document.querySelector('.PS-custom-Drawer').style.display = 'none';
                          });
                  });
                  });
              });
      
              buttonClose.addEventListener('click', function() {
                  document.querySelector('.PS-custom-Drawer').style.display = 'none';
              });
      
      
            }
      
          // Initial product picker setup based on the default selected boxlimit (3 Addons)
          const initialLimit = document.querySelector('.product-color.selected').getAttribute('boxlimit');
          generateProductPickerOptions(initialLimit);
      
          // Handle kit selection and update product picker options based on boxlimit
          document.querySelectorAll('.product-color-option-section .product-color').forEach(colorOption => {
              colorOption.addEventListener('click', function() {
                  const boxlimit = colorOption.getAttribute('boxlimit');
                  
                  // Remove selected class from all color options
                  document.querySelectorAll('.product-color-option-section .product-color').forEach(option => {
                      option.classList.remove('selected');
                  });
                  
                  // Add selected class to the clicked color option
                  colorOption.classList.add('selected');
      
                  // Generate new product picker options based on the selected boxlimit
                  generateProductPickerOptions(boxlimit);
      
              
              });
          });
      
          
          // add to cart js
          const submitbutton = document.querySelector('.psAddon-submit-button');
      
      
          submitbutton.addEventListener('click', function(event) {
      
              event.preventDefault();
              let randomNumber = Math.floor(Math.random() * 10000);
              let timestamp = new Date().getTime();
              let uniqueNumber = timestamp.toString() + randomNumber.toString();
              document.querySelector("#PS-groupid").value = uniqueNumber;
      
              const addonsid = document.querySelectorAll('.product-picker-col input[name="ps_choosed_variant_id"]')
              const length = addonsid.length;
              // alert(length);
      
              addonsid.forEach((addon, index) => {
                  const id = addon.value;
                  
                  if(id != ''){
                      // alert(id);
                      setTimeout(function() {
                          fetch('/cart/add.js', {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                  id: id,
                                  quantity: 1,
                                  properties: {
                                      PSProductAddonid: uniqueNumber
                                  }
                              }),
                          })
                          .then(response => response.json())
                          .then(data => {
                              console.log('Product ' + id + ' added to cart successfully');
                              if (index == length-1) {
                                document.querySelector('form[action="/cart/add"] button[type="submit"]').click();
                              }
                              
                          })
                          .catch(error => {
                              console.error('Error adding product ' + id + ' to cart:', error);
                          });
                      }, 1000 * index, index);
                   }
              });
      
          });

        }
        // Initialize the component
        init();
            
    }
});

