# Grada Walkthrough

Hi,

Here’s a simple walkthrough you can follow to get a feel for the product on your own.

The best way to test Grada is not screen by screen, but as one connected workflow:

`Catalog -> PO Format Builder -> Received PO -> Review -> Confirm -> Documents`

If you follow the steps below, you should get a good sense of how the system works end to end.

## What I recommend you do

## 1. Sign in and land on the dashboard

Please start by opening the product link and signing in.

Once you’re in, spend a minute just scanning the dashboard and side navigation. The main idea to keep in mind is that Grada is meant to connect catalog data, incoming POs, and dispatch documents in one flow.

## 2. Open Smart Catalog

Go to `Catalog`.

Here I’d like you to just browse a few products and open one or two records. You’ll notice the product data is structured for operations, not just listing products visually.

Things worth noticing:

- category and style information
- color, fabric, composition, and other product attributes
- how the product data looks ready to be reused downstream

This part is important because the system is designed to keep product data clean and reusable instead of scattered across sheets and chats.

## 3. Open PO Format Builder

Next, go to `PO Format Builder`.

Here, I’d suggest creating a PO format / PO sheet flow from catalog data so you can see how the system moves from product data into an operational PO structure.

What I’d like you to notice here:

- the catalog is not isolated from operations
- product information can flow forward into PO preparation
- this helps standardize how data is structured before it comes back in downstream

You do not need to spend too long here. The main point is to see that Grada is designed to connect catalog work with PO workflows.

## 4. Open Received PO Processing

Next, go to `Received POs`.

If I’ve shared a sample PO file with you, please upload that file here.

If a sample file is not available, open any existing received PO record already present in the environment.

This is one of the most important areas of the product, because it turns raw marketplace PO data into something the team can actually review and use.

## 5. Review the parsed PO

Once the PO is uploaded and parsed, open it and review the extracted data.

Please look at:

- the PO header details
- the line items
- quantities and style rows

If anything looks editable, feel free to try that as well.

The key thing I want you to notice here is that the system does not force you to trust the parsed result blindly. There is a review step before anything moves downstream.

## 6. Confirm the PO

After reviewing the PO, confirm it.

This confirmation step matters a lot. It acts as the control gate before downstream documents can be generated.

That means barcode PDFs, invoices, and packing lists only become available after the PO has been reviewed and confirmed.

## 7. Generate the documents

Once the PO is confirmed, go to the documents section and try generating:

- `Barcodes`
- `Invoice`
- `Packing List`

This is the part where the workflow should feel seamless.

What I’d like you to notice:

- all of these documents come from the same confirmed PO
- you are not re-entering the same data over and over
- the system feels like one connected operational workflow rather than separate tools stitched together

## 8. Open and inspect the generated PDFs

After generation completes, open the PDFs and inspect them.

Please check whether the outputs feel operationally usable and whether they clearly reflect the confirmed PO data you reviewed earlier.

This is really the core product experience:

- upload inbound PO
- review and correct it
- confirm it once
- generate downstream outputs from that same source of truth

## 9. Optional: explore a little more

If you want to go one step further, you can also try:

- opening the sticker template builder to understand custom barcode templates
- comparing how invoice data is presented
- seeing how the packing list fits into the same workflow

## Best short version if you only have 5 minutes

If you want the quickest possible test, I’d suggest this order:

1. Open `Catalog`
2. Open `PO Format Builder`
3. Open `Received POs`
4. Upload or open a PO
5. Review it
6. Confirm it
7. Generate `Barcodes`
8. Then quickly check `Invoice` and `Packing List`

That gives the fastest feel for what Grada is trying to do.

## What I’d love your feedback on

As you go through it, the most useful feedback for me would be:

- whether the flow feels intuitive
- whether the review-and-confirm step makes sense
- whether the downstream documents feel clearly connected to the PO
- whether the product feels like it reduces manual work

That should be enough to get a real feel for the product without any live walkthrough from my side.
