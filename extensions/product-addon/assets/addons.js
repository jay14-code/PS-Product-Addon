
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.includes('/products/')) {
        
        const contain = document.getElementById('jay-developer');
        const form = document.querySelector('form[action="/cart/add"] button[type="submit"]');

        if (contain && form) {
            const parentForm = form.closest('form');
            parentForm.appendChild(contain); 
            contain.style.display = 'block'; 
            // form.classList.add('psAddon-submit-button');
        }
    }

    // Handle selection of color options (Starter Kit or Premium Kit)
    document.querySelectorAll('.product-color-option-section .product-color').forEach(colorOption => {
        colorOption.addEventListener('click', function() {
        const boxlimit = colorOption.getAttribute('boxlimit');
        
       
        document.querySelectorAll('.product-color-option-section .product-color').forEach(option => {
            option.classList.remove('selected');
        });
    
        
        document.querySelectorAll('.boxlimit').forEach(box => {
            box.classList.remove('active');
            const limit = box.getAttribute('boxlimit');
            if (limit === boxlimit) {
            box.classList.add('active');
            }
        });
    
        colorOption.classList.add('selected');
        });
    });
    
    // Handle opening of the drawer and selecting an image
    const buttons = document.querySelectorAll('.product-picker-col');
    const buttonClose = document.querySelector('.drawer-close');
    
   
    buttons.forEach((button, index) => {
        button.addEventListener('click', function() {
        document.querySelector('.custom-drawer-two').style.display = 'block';
    
        
        const items = document.querySelectorAll(".Ps-AddonProduct-item");
    
        items.forEach(item => {
            item.addEventListener('click', function() {
            
            const selectedImageSrc = item.querySelector('.Ps-AddonProduct-image img').src;
            const productId = item.querySelector('.Ps-AddonProduct-item input[name="ps_selected_variant_id"]').value;
    
            
            const currentPicker = this.querySelector(`.product-icon-picker${index + 1}`);
            if (currentPicker) {
                currentPicker.style.display = 'none';
            }
    
          
            const selectedImage = this.querySelector(`#selectedImage${index + 1}`);
            if (selectedImage) {
            selectedImage.setAttribute('src', selectedImageSrc);
            selectedImage.style.display = 'block';
            }
    
            
            const pickerInput = this.querySelector(`#ps-choosedID${index+1}`);
            if (pickerInput) {
                pickerInput.setAttribute('value', productId);
            }
    
            
            document.querySelector('.custom-drawer-two').style.display = 'none';
            });
        });
        });
    });
    

    buttonClose.addEventListener('click', function() {
        document.querySelector('.custom-drawer-two').style.display = 'none';
    });
  
    


    // add to cart js
    // const submitbutton = document.querySelector('.psAddon-submit-button');


    // submitbutton.addEventListener('click', function(event) {

    //     event.preventDefault();
    //     let randomNumber = Math.floor(Math.random() * 10000);
    //     let timestamp = new Date().getTime();
    //     let uniqueNumber = timestamp.toString() + randomNumber.toString();

    //     const addonsid = document.querySelectorAll('.product-picker-col input[name="ps_choosed_variant_id"]')
    //     const length = addonsid.length;

    //     addonsid.forEach((addon, index) => {
    //         const id = addon.value;

    //         if(id != ''){
    //         event.preventDefault();
    //         setTimeout(function(value) {
    //         fetch('/cart/add.js', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 id: id,
    //                 quantity: 1,
    //                 properties: {
    //                     bundleid: uniqueNumber
    //                 }
    //             }),
    //         })
    //         .then(response => response.json())
    //         .then(data => {
    //             console.log('Product ' + id + ' added to cart successfully');
    //             if (index === length-1) {
    //                 document.querySelector(".product-form__submit").click();
    //             }
                
    //         })
    //         .catch(error => {
    //             console.error('Error adding product ' + id + ' to cart:', error);
    //         });
    //       }, 1000 * value, value);
    //       }
    //     });

    // });
    
    
});


