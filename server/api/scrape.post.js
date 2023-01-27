import puppeteer from "puppeteer";
var productsToReturn = []

export default defineEventHandler( async (event) => {
    //launches a new browser
    const browser = await puppeteer.launch({headless: false});
    //creating a new page
    const page = await browser.newPage();

    //reading the term passed in the event and storing it in a variable
    const { term } = await readBody(event);

    
    //navigating to the search term on amazon's website
    await page.goto("https://www.amazon.com/" + term + "/s?k=" + term);
    
    //calling the scroll function
    await scroll(page)

    return {result: productsToReturn}
});

//scroll function that is used to scroll through the pages and scrape the data
async function scroll(page) {
    try {
      //while true loop that will continue until the next button is not found
        while (true) {
          //page.evaluate is used to execute a function in the context of the page
          var productsEvaluate = await page.evaluate(async () => {
            const products = [];
            
            //promise that will resolve once the page has finished scrolling
            await new Promise((resolve, reject) => {
              var totalHeight = 0;
              var distance = 100;
              var timer = setInterval(async () => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                
              //if the total height of the page is greater or equal to the scroll height, stop scrolling
                if (totalHeight >= scrollHeight) {
                  clearInterval(timer);
                  resolve();
                }
              }, 100);
            });
            
            //selecting all the product elements on the page
            const productsElement = document.querySelectorAll(
              '[data-csa-c-type="item"]'
            );
              
            //iterating through the product elements
            for (let element of productsElement) {
              const product = {
                date: Date.now(),
                name: "",
                stars: 0,
                price: 0,
                url: "",
                img: "",
              };

              //Get product name 
              try {
                product.name = element.querySelector(
                  '[class="a-size-medium a-color-base a-text-normal"]'
                ).innerHTML;
              } catch (error) {
                console.log("No name");
              }
    
              // Get product stars
              try {
                product.stars = element.querySelector(
                  '[class="a-icon-alt"]'
                ).innerHTML;
              } catch (error) {
                console.log("No stars");
              }
    
              //Get product price
              try {
                product.price = element.querySelector(
                  '[class="a-offscreen"]'
                ).innerHTML;
              } catch (error) {
                console.log("No price");
              }
              
              // Get product url
              try {
                el = element.querySelector(
                  '[class="a-link-normal s-underline-text s-underline-link-text s-link-style a-text-normal"]'
                );
                product.url = "https://www.amazon.com" + el.getAttribute("href");
              } catch (error) {
                console.log('no url')
              }
    
              //Get product image
              try {
                el = element.querySelector('[class="s-image"]');
                product.img = el.getAttribute("src");
              } catch (error) {
                console.log('No image')
              }
    
              // Add product to the list of products
              products.push(product);
            }

            // Return the list of products    
            return products;
          });
    
          console.log(productsEvaluate);

          // Add the products returned by this iteration to the overall list of products
          productsToReturn = productsToReturn.concat(productsEvaluate)

          try {
            // Click on the next button to go to the next page
            await page.click(
              '[class="s-pagination-item s-pagination-next s-pagination-button s-pagination-separator"]',
              { timeout: 1000 }
            );
          } catch (error) {
            // If there's no next button, exit the loop
            console.log("No next button")
            break
          }
        }
      } catch (error) {
        console.log(error);
        
      }
}