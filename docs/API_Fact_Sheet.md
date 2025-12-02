API Fact Sheet
We offer two API integration methods for sellers:

Seller Integration with POIZON: Sellers can seamlessly connect their products, inventory, orders, and other data to the POIZON platform via our API. This option is perfect for sellers using self-developed ERP systems, allowing for tailored and selective integration of modules to streamline management on POIZON.
POIZON Integration with Sellers: POIZON can connect to a seller’s system via API to retrieve and synchronize product, inventory, order, and other data, simplifying operations for sellers. This approach is perfect for sellers using third-party ERP systems such as Shopify, WooCommerce, BigCommerce, Adobe Magento, PrestaShop, Atelier, and more. POIZON will manage the API integration, taking care of the technical details and heavy lifting to ensure a smooth and efficient process for sellers.
Listing Types
We offer two listing types for sellers:

Manual Listing: Sellers can set product prices based on market conditions and their own strategies. This type provides sellers with greater pricing control, suitable for those with a clear pricing strategy.
Smart Listing: POIZON automatically sets optimal product prices for sellers, incorporating a markup based on the platform’s market data. This type is perfect for sellers who wish to streamline operations and benefit from POIZON’s data-driven pricing.
Fulfillment Types
Based on the sellers' business needs, we offer the following four fulfillment types:

Ship-to-verify: Sellers store product inventory in their own warehouses and ship orders when they are placed. This type is suitable for sellers with stable inventory and timely shipping capabilities.
Consignment: Sellers can store their products in POIZON’s warehouse, where POIZON manages storage and shipping. This type simplifies logistics management for sellers and improves shipping speed.
Pre-sale: Sellers can start selling products before they arrive, with shipping occurring once the products are in stock. This type is suitable for products that require securing customer orders in advance.
Bonded: Products are stored in a bonded area, where POIZON manages customs and shipping. This is ideal for cross-border e-commerce, helping sellers reduce tax costs.
API List
Below is the list of APIs we provide, supporting the above integration methods, listing types, and fulfillment types.

Seller Integration with POIZON
Seller Integration with POIZON
Manual Listing	Smart Listing
Use Case	Fulfillment Type	API	Fulfillment Type	API
Commodity	Ship-to-verify/Pre-sale/Consignment	Query Sku&Spu Information by Brand Official Item Number - Batch	Ship-to-verify/Pre-sale	Add Hosted Data
Query by Category ID and Language	Query Hosted Data
Query Spu Information by Category ID - Batch	Update Hosted Data
Query Spu Information by Brand ID - Batch	Modify New Item
Query Sku&Spu Information by globalSkuId - Batch	Submit New Product
Paginated Query by Category Name and Language	Get New Product Details
Query Category Tree (Default Query All First-Level Categories)	Reapply for Stock Check
Query by Brand ID and Language	Create Single Goods Opportunity Inventory
Query Brand ID by Brand Name	View Goods Opportunity Inventory Details
Query Spu Basic Information by globalSpuId (Multilingual & Batch Support)	Submit New Product for Review
Get New Product List
Delete New Product Draft
Listing
Recommendations	Ship-to-verify/Pre-sale/Consignment	Listing Recommendations		
Listing Recommendations - Batch		
Listing	Ship-to-verify	Manual Listing (Ship-to-verify)		
Cancel Listing		
Update Manual Listing (Ship-to-verify)		
Query Listing List		
Presale	Manual Listing (Pre-sale)		
Update Manual Listing (Pre-sale)		
Cancel Listing		
Query Listing List		
Bonded	Get Merchant Listing Information [Bonded Warehouse]		
Automate Listing		
Get Real-time Inventory of Seller's On-sale SKU [Bonded Warehouse]		
Query Order List [Bonded Warehouse]		
Incremental Order Retrieval [Bonded Warehouse]		
Get Platform's Lowest Price for SKU [Cross-border-bonded Warehouse]		
Cancel Listing [Bonded Warehouse]		
Update Listing [Bonded Warehouse]		
Consignment	Query Inventory (Consignment)		
Query Listing List (Consignment)		
Query Listing List		
Update Manual Listing (Consignment)		
Manual Listing (Consignment)		
Cancel Listing		
Consignment	Consignment	Outbound - Order Fee Waiver Application		
Outbound - Cancel Outbound Order		
Outbound - Sign for Outbound Order		
Outbound - Pay for Outbound Order		
Outbound - Get Outbound Package List		
Outbound - Get Self-Pickup Appointment Information		
Outbound - Schedule Order for Self-Pickup		
Outbound - Get Outbound Order List		
Outbound - Create Order		
Inbound - Create Order Asynchronously		
Inbound - Get Asynchronous Order Creation Result		
Inbound - Get Order List		
Inbound - Get Inspection Detail List		
Inbound - Modify Shipping Information		
Inbound - Cancel Order		
Get Consignment Application List		
Cancel Consignment Application		
Create Consignment Application		
Order	Ship-to-verify	Confirm Order	Ship-to-verify	Confirm Order
Ship-to-verify/Pre-sale	Ship Order	Ship-to-verify/Pre-sale	Ship Order
Get Express Label Info for Online Orders	Get Express Label Info for Online Orders
Ship-to-verify/Pre-sale/Consignment	Query Order List by Order Type	Ship-to-verify/Pre-sale/Consignment	Query Order List by Order Type
Bill	Ship-to-verify/Pre-sale/Consignment	Generate Billing Cycle Invoice	Ship-to-verify/Pre-sale/Consignment	Generate Billing Cycle Invoice
Download Billing Cycle Invoice	Download Billing Cycle Invoice
Get Billing Cycle Reconciliation List	Get Billing Cycle Reconciliation List
Get Return Orders	Get Return Orders
Get Real-Time Reconciliation List	Get Real-Time Reconciliation List
Return	Ship-to-verify/Pre-sale/Consignment	Query Return Outbound Order	Ship-to-verify/Pre-sale/Consignment	Query Return Outbound Order
Query Return Fulfillment Order	Query Return Fulfillment Order
Create Self-Pickup Appointment Order	Create Self-Pickup Appointment Order
Create Return Order	Create Return Order
Others	Ship-to-verify/Pre-sale/Consignment	Get Announcement Details	Ship-to-verify/Pre-sale/Consignment	Get Announcement Details


POIZON Integration with Sellers
POZION Integration with Sellers
Smart Listing
1. POIZON Support List Types	Ship-to-verify/Pre-sale
2. The API required from Sellers	API - Overall Commodity Information
API - Updated Commodity Information
API - Order
3. Required Fields Provided by Sellers	spuId	Product ID based on color
skuId	Product ID based on size with one color
brandName	Brand name
designerId	Brand style ID or manufacturer ID
gender	The target audience for the product: women, men, unisex, etc
category	The product category, shoes, apparel, bags, etc
season	The season information for product, like FW24, SS24, etc
size	The size for a product
sizeType	Size system, EU, UK, US, FR, JP, etc. Only Required for shoes and clothes
images	Images url link for the product
stock	The stock quantity for a product
(Provide at least one of the following four options)
retailPrice	Retail price, VAT INCLUDED, no discount
dutyFreePrice	Retail price, VAT EXCLUDED, no discount
purchasePrice	Supply price, VAT EXCLUDED, discount APPLIED
taxPurchasePrice	Supply price, VAT INCLUDED, discount APPLIED
