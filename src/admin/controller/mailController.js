import { transporter } from "../../../config/mailConfig.js";

const normalProductsOrder = (ordersData) => {
  return {
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Order Confirmation</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:30px 0;">
<tr>
<td align="center">

<table width="700" cellpadding="0" cellspacing="0" border="0"
style="background:#ffffff;border-radius:10px;overflow:hidden;">

    <!-- HEADER -->
    <tr>
        <td style="background:#111827;padding:25px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;">
                Order Confirmed
            </h1>
            <p style="color:#d1d5db;margin-top:8px;font-size:14px;">
                Thank you for your purchase
            </p>
        </td>
    </tr>

    <!-- SUCCESS MESSAGE -->
    <tr>
        <td style="padding:30px;">
            <h2 style="margin:0;color:#111827;font-size:22px;">
                Hi {{customerName}}
            </h2>

            <p style="color:#4b5563;font-size:15px;line-height:24px;margin-top:15px;">
                Your order has been placed successfully.
                We’re preparing your items for shipment and will notify you once your order is shipped.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
            style="margin-top:25px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                    <td style="padding:20px;">

                        <table width="100%">
                            <tr>
                                <td>
                                    <p style="margin:0;color:#6b7280;font-size:13px;">
                                        Order ID
                                    </p>
                                    <p style="margin:5px 0 0;font-weight:bold;color:#111827;">
                                        #{{orderId}}
                                    </p>
                                </td>

                                <td align="right">
                                    <p style="margin:0;color:#6b7280;font-size:13px;">
                                        Order Date
                                    </p>
                                    <p style="margin:5px 0 0;font-weight:bold;color:#111827;">
                                        {{orderDate}}
                                    </p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </td>
    </tr>

    <!-- CUSTOMER DETAILS -->
    <tr>
        <td style="padding:0 30px 30px;">

            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>

                    <!-- CUSTOMER -->
                    <td width="48%" valign="top"
                    style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;">

                        <h3 style="margin-top:0;color:#111827;">
                            Customer Details
                        </h3>

                        <p style="margin:8px 0;color:#4b5563;">
                            <strong>Name:</strong> {{customerName}}
                        </p>

                        <p style="margin:8px 0;color:#4b5563;">
                            <strong>Email:</strong> {{customerEmail}}
                        </p>

                        <p style="margin:8px 0;color:#4b5563;">
                            <strong>Phone:</strong> {{customerPhone}}
                        </p>

                    </td>

                    <td width="4%"></td>

                    <!-- ADDRESS -->
                    <td width="48%" valign="top"
                    style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;">

                        <h3 style="margin-top:0;color:#111827;">
                            Shipping Address
                        </h3>

                        <p style="margin:8px 0;color:#4b5563;line-height:24px;">
                            {{addressLine1}}<br/>
                            {{addressLine2}}<br/>
                            {{city}} - {{pincode}}<br/>
                            {{state}}, {{country}}
                        </p>

                    </td>

                </tr>
            </table>

        </td>
    </tr>

    <!-- PRODUCTS -->
    <tr>
        <td style="padding:0 30px 30px;">

            <h2 style="color:#111827;margin-bottom:20px;">
                Order Items
            </h2>

            <!-- PRODUCT LOOP START -->
            <!-- Repeat this block -->

            <table width="100%" cellpadding="0" cellspacing="0"
            style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:15px;">

                <tr>

                    <!-- IMAGE -->
                    <td width="120" style="padding:15px;">
                        <img src="{{productImage}}"
                        width="100"
                        height="100"
                        style="border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;" />
                    </td>

                    <!-- DETAILS -->
                    <td style="padding:15px;">

                        <h3 style="margin:0;color:#111827;font-size:18px;">
                            {{productName}}
                        </h3>

                        <p style="margin:8px 0;color:#6b7280;font-size:14px;">
                            Quantity: {{quantity}}
                        </p>

                        <p style="margin:8px 0;color:#6b7280;font-size:14px;">
                            Price: ₹{{price}}
                        </p>

                    </td>

                    <!-- TOTAL -->
                    <td align="right" style="padding:15px;">
                        <h3 style="margin:0;color:#111827;">
                            ₹{{total}}
                        </h3>
                    </td>

                </tr>

            </table>

            <!-- PRODUCT LOOP END -->

        </td>
    </tr>

    <!-- AMOUNT DETAILS -->
    <tr>
        <td style="padding:0 30px 30px;">

            <table width="100%" cellpadding="0" cellspacing="0"
            style="border:1px solid #e5e7eb;border-radius:8px;">

                <tr>
                    <td style="padding:20px;">

                        <table width="100%" cellpadding="8">

                            <tr>
                                <td style="color:#6b7280;">
                                    Subtotal
                                </td>

                                <td align="right" style="color:#111827;">
                                    ₹{{subtotal}}
                                </td>
                            </tr>

                            <tr>
                                <td style="color:#6b7280;">
                                    Delivery Charge
                                </td>

                                <td align="right" style="color:#111827;">
                                    ₹{{deliveryCharge}}
                                </td>
                            </tr>

                            <tr>
                                <td style="color:#6b7280;">
                                    Tax
                                </td>

                                <td align="right" style="color:#111827;">
                                    ₹{{tax}}
                                </td>
                            </tr>

                            <tr>
                                <td colspan="2">
                                    <hr style="border:none;border-top:1px solid #e5e7eb;">
                                </td>
                            </tr>

                            <tr>
                                <td style="font-size:18px;font-weight:bold;color:#111827;">
                                    Grand Total
                                </td>

                                <td align="right"
                                style="font-size:20px;font-weight:bold;color:#111827;">
                                    ₹{{grandTotal}}
                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>

            </table>

        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td style="background:#f9fafb;padding:25px;text-align:center;">

            <p style="margin:0;color:#6b7280;font-size:14px;">
                If you have any questions, contact our support team.
            </p>

            <p style="margin-top:10px;color:#111827;font-weight:bold;">
                Thank You for Shopping With Us
            </p>

        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  };
};

const monthlyProductsOrders = (ordersData) => {
  return {
    subject: "Monthly Orders Summary",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #007bff; color: white; padding: 15px; text-align: center;">
                <h2>New Order Received</h2>
            </div>
            <div style="padding: 20px;">
                <p>Hello Admin,</p>
                <p>You have received a new order.</p>
                <h3>Order Details:</h3>
                <ul>
                    ${ordersData
                      .map(
                        (order) => `
                        <li>
                            <strong>Product:</strong> ${order.productName}<br/>
                            <strong>Quantity:</strong> ${order.quantity}<br/>
                            <strong>Total Price:</strong> ₹${order.totalPrice}
                        </li>
                    `,
                      )
                      .join("")}
                </ul>
                <p>Thank you!</p>
            </div>
        </div>
        `,
  };
};

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"Test Service" <${process.env.SMTP_MAIL}>`,
    to,
    subject,
    text,
    replyTo: process.env.SMTP_MAIL,
    html:normalProductsOrder({})
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Message sent:", info.messageId);

  return info;
};

export const handleSendEmail = async (req, res) => {
  const { to, subject, text } = req.body;

  console.log(req.body);

  if (!to || !subject || !text) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: to, subject, text",
    });
  }

  try {
    const info = await sendEmail(to, subject, text);
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error) {
    console.error("Controller Error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
