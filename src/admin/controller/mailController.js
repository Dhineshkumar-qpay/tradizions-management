import { transporter } from "../../../config/mailConfig.js";

export const normalProductsOrder = (ordersData) => {
  const renderAddress = (addr) => {
    if (!addr) return "—";
    return [
      addr.fullname || "",
      addr.addressline || "",
      addr.landmark || "",
      `${addr.city || ""} - ${addr.pincode || ""}`,
      `${addr.state || ""}, ${addr.country || ""}`,
    ]
      .filter(Boolean)
      .join("<br/>");
  };

  // Accent = olive green
  const accent = "#5a7a2e";
  const accentLight = "#eef5e0";

  return {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f2f5;padding:32px 0;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.09);">

  <!-- HEADER -->
  <tr>
    <td style="background:#1a2c52;padding:28px 40px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
        <tr>
          <td style="width:54px;height:54px;border-radius:50%;background:#ffffff;text-align:center;vertical-align:middle;">
            <span style="font-size:26px;color:#1a2c52;font-weight:900;line-height:54px;">&#10003;</span>
          </td>
        </tr>
      </table>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Order Placed Successfully!</h1>
      <p style="color:#b0bedc;margin:8px 0 0;font-size:14px;">Thank you for shopping with us. Your order has been received.</p>
    </td>
  </tr>

  <!-- ORDER NUMBER BAR -->
  <tr>
    <td style="padding:20px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:7px;">
        <tr>
          <td style="padding:16px 20px;border-right:1px solid #dde3ec;" width="50%">
            <p style="margin:0;color:#888;font-size:12px;">Order Number</p>
            <p style="margin:5px 0 0;color:#1a2c52;font-size:17px;font-weight:700;">#${ordersData?.orderId || ""}</p>
          </td>
          <td style="padding:16px 20px;" width="50%">
            <p style="margin:0;color:#888;font-size:12px;">Order Date</p>
            <p style="margin:5px 0 0;color:#1a2c52;font-size:16px;font-weight:700;">${ordersData?.orderDate || ""}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CUSTOMER + ADDRESS -->
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:7px;overflow:hidden;">
        <tr>
          <td width="50%" valign="top" style="padding:18px 20px;border-right:1px solid #dde3ec;">
            <p style="margin:0 0 12px;color:${accent};font-size:14px;font-weight:700;">
              <span style="margin-right:6px;">&#128100;</span> Customer Details
            </p>
            <table cellpadding="4" cellspacing="0">
              <tr>
                <td style="color:#555;font-size:13px;white-space:nowrap;">Name</td>
                <td style="color:#555;font-size:13px;padding:0 6px;">:</td>
                <td style="color:#222;font-size:13px;">${ordersData?.customerName || ""}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:13px;white-space:nowrap;">Email</td>
                <td style="color:#555;font-size:13px;padding:0 6px;">:</td>
                <td style="color:#222;font-size:13px;">${ordersData?.customerEmail || ""}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:13px;white-space:nowrap;">Phone</td>
                <td style="color:#555;font-size:13px;padding:0 6px;">:</td>
                <td style="color:#222;font-size:13px;">${ordersData?.customerPhone || ""}</td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding:18px 20px;">
            <p style="margin:0 0 12px;color:${accent};font-size:14px;font-weight:700;">
              <span style="margin-right:6px;">&#128205;</span> Shipping Address
            </p>
            ${ordersData?.issameaddress !== false
        ? `
            <p style="margin:0;color:#333;font-size:13px;line-height:22px;">
              ${ordersData?.addressLine1 || ""}<br/>
              ${ordersData?.addressLine2 ? ordersData.addressLine2 + "<br/>" : ""}
              ${ordersData?.city || ""} - ${ordersData?.pincode || ""}<br/>
              ${ordersData?.state || ""}, ${ordersData?.country || ""}
            </p>
            `
        : `<p style="margin:0;color:#777;font-size:13px;font-style:italic;">See per-item address below</p>`
      }
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ORDER ITEMS -->
  <tr>
    <td style="padding:0 32px 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:7px;overflow:hidden;">
        <!-- HEADING -->
        <tr>
          <td colspan="4" style="padding:14px 18px;border-bottom:1px solid #dde3ec;">
            <p style="margin:0;color:${accent};font-size:14px;font-weight:700;">&#128722; Order Items</p>
          </td>
        </tr>
        <!-- TABLE HEADER -->
        <tr style="background:#f8f9fb;">
          <td style="padding:10px 18px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;" width="45%">Product</td>
          <td style="padding:10px 12px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;text-align:center;" width="20%">Price</td>
          <td style="padding:10px 12px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;text-align:center;" width="15%">Quantity</td>
          <td style="padding:10px 18px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;text-align:right;" width="20%">Total</td>
        </tr>

        <!-- PRODUCT ROWS -->
        ${(ordersData?.items || [])
        .map(
          (item, index) => `
        <tr style="border-bottom:1px solid #f0f2f5;">
          <td style="padding:14px 18px;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;vertical-align:middle;">
                  <img src="${item.productImage && item.productImage.includes("http") ? item.productImage : "http://localhost:3000" + (item.productImage || "")}"
                    width="54" height="54" style="border-radius:6px;object-fit:cover;display:block;border:1px solid #e0e0e0;" alt="${item.productName || ""}"/>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0;color:#1a2c52;font-size:14px;font-weight:600;">${item.productName || ""}</p>
                  ${!ordersData?.issameaddress && item.address
              ? `
                  <p style="margin:5px 0 0;color:#5a7a2e;font-size:11px;line-height:17px;">
                    &#128205; ${item.address.addressline || ""}${item.address.city ? ", " + item.address.city : ""}${item.address.pincode ? " - " + item.address.pincode : ""}
                  </p>
                  `
              : ""
            }
                </td>
              </tr>
            </table>
          </td>
          <td style="padding:14px 12px;color:#333;font-size:14px;text-align:center;vertical-align:middle;">&#8377;${item.price || 0}</td>
          <td style="padding:14px 12px;color:#333;font-size:14px;text-align:center;vertical-align:middle;">${item.quantity || 1}</td>
          <td style="padding:14px 18px;color:#1a2c52;font-size:14px;font-weight:700;text-align:right;vertical-align:middle;">&#8377;${item.total || 0}</td>
        </tr>
        `,
        )
        .join("")}
      </table>
    </td>
  </tr>

  <!-- ORDER TOTALS -->
  <tr>
    <td style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:0 0 7px 7px;border-top:none;overflow:hidden;">
        <tr>
          <td style="padding:12px 18px;">
            <table width="100%" cellpadding="6" cellspacing="0">
              <tr>
                <td style="color:#555;font-size:14px;">Subtotal</td>
                <td align="right" style="color:#333;font-size:14px;">&#8377;${ordersData?.subtotal || 0}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:14px;">Delivery Charges</td>
                <td align="right" style="color:#333;font-size:14px;">&#8377;${ordersData?.deliveryCharge || 0}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:14px;">Tax</td>
                <td align="right" style="color:#333;font-size:14px;">&#8377;${ordersData?.tax || 0}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:4px 0;">
                  <hr style="border:none;border-top:2px dashed #dde3ec;margin:6px 0;"/>
                </td>
              </tr>
              <tr>
                <td style="color:#1a2c52;font-size:16px;font-weight:700;">Grand Total</td>
                <td align="right" style="color:${accent};font-size:18px;font-weight:800;">&#8377;${ordersData?.grandTotal || 0}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:0 32px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${accentLight};border-radius:7px;">
        <tr>
          <td style="padding:16px 20px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:14px;vertical-align:top;font-size:22px;color:${accent};">&#127911;</td>
                <td>
                  <p style="margin:0;color:#444;font-size:13px;">If you have any questions, feel free to contact our support team.</p>
                  <p style="margin:5px 0 0;color:#1a2c52;font-size:13px;font-weight:700;">Thank you for choosing healthy living!</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  };
};

export const monthlyProductsOrders = (ordersData) => {
  // Accent = blue (image style)
  const accent = "#2a5298";
  const accentLight = "#eef3fb";

  return {
    subject: "Monthly Order Confirmed",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Monthly Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f2f5;padding:32px 0;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.09);">

  <!-- HEADER -->
  <tr>
    <td style="background:#1a2c52;padding:28px 40px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
       <tr>
          <td style="width:54px;height:54px;border-radius:50%;background:#ffffff;text-align:center;vertical-align:middle;">
            <span style="font-size:26px;color:#1a2c52;font-weight:900;line-height:54px;">&#10003;</span>
          </td>
        </tr>
      </table>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Monthly Order Confirmed!</h1>
      <p style="color:#b0bedc;margin:8px 0 0;font-size:14px;">Your recurring delivery plan is all set and activated.</p>
    </td>
  </tr>

  <!-- ORDER NUMBER BAR -->
  <tr>
    <td style="padding:20px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:7px;">
        <tr>
          <td style="padding:16px 20px;border-right:1px solid #dde3ec;" width="50%">
            <p style="margin:0;color:#888;font-size:12px;">Order Number</p>
            <p style="margin:5px 0 0;color:#1a2c52;font-size:17px;font-weight:700;">#${ordersData?.orderId || ""}</p>
          </td>
          <td style="padding:16px 20px;" width="50%">
            <p style="margin:0;color:#888;font-size:12px;">Order Date</p>
            <p style="margin:5px 0 0;color:#1a2c52;font-size:16px;font-weight:700;">${ordersData?.orderDate || ""}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CUSTOMER + ADDRESS -->
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:7px;overflow:hidden;">
        <tr>
          <td width="50%" valign="top" style="padding:18px 20px;border-right:1px solid #dde3ec;">
            <p style="margin:0 0 12px;color:${accent};font-size:14px;font-weight:700;">
              <span style="margin-right:6px;">&#128100;</span> Customer Details
            </p>
            <table cellpadding="4" cellspacing="0">
              <tr>
                <td style="color:#555;font-size:13px;white-space:nowrap;">Name</td>
                <td style="color:#555;font-size:13px;padding:0 6px;">:</td>
                <td style="color:#222;font-size:13px;">${ordersData?.customerName || ""}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:13px;white-space:nowrap;">Email</td>
                <td style="color:#555;font-size:13px;padding:0 6px;">:</td>
                <td style="color:#222;font-size:13px;">${ordersData?.customerEmail || ""}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:13px;white-space:nowrap;">Phone</td>
                <td style="color:#555;font-size:13px;padding:0 6px;">:</td>
                <td style="color:#222;font-size:13px;">${ordersData?.customerPhone || ""}</td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding:18px 20px;">
            <p style="margin:0 0 12px;color:${accent};font-size:14px;font-weight:700;">
              <span style="margin-right:6px;">&#128205;</span> Delivery Address
            </p>
            <p style="margin:0;color:#333;font-size:13px;line-height:22px;">
              ${ordersData?.addressLine1 || ""}<br/>
              ${ordersData?.addressLine2 ? ordersData.addressLine2 + "<br/>" : ""}
              ${ordersData?.city || ""} - ${ordersData?.pincode || ""}<br/>
              ${ordersData?.state || ""}, ${ordersData?.country || ""}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- MONTHLY ITEMS -->
  <tr>
    <td style="padding:0 32px 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:7px;overflow:hidden;">
        <!-- HEADING -->
        <tr>
          <td colspan="4" style="padding:14px 18px;border-bottom:1px solid #dde3ec;">
            <p style="margin:0;color:${accent};font-size:14px;font-weight:700;">&#128230; Monthly Order Items</p>
          </td>
        </tr>
        <!-- TABLE HEADER -->
        <tr style="background:#f8f9fb;">
          <td style="padding:10px 18px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;" width="40%">Product</td>
          <td style="padding:10px 10px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;text-align:center;" width="22%">Consumption</td>
          <td style="padding:10px 10px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;text-align:center;" width="18%">Qty (kg)</td>
          <td style="padding:10px 18px;color:#555;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eaecf0;text-align:right;" width="20%">Total</td>
        </tr>

        <!-- PRODUCT ROWS -->
        ${(ordersData?.items || [])
        .map(
          (item) => `
        <tr style="border-bottom:1px solid #f0f2f5;">
          <td style="padding:14px 18px;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;vertical-align:middle;">
                  <img src="${item.productImage && item.productImage.includes("http") ? item.productImage : "http://localhost:3000" + (item.productImage || "")}"
                    width="54" height="54" style="border-radius:6px;object-fit:cover;display:block;border:1px solid #e0e0e0;" alt="${item.productName || ""}"/>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0;color:#1a2c52;font-size:14px;font-weight:600;">${item.productName || ""}</p>
                  <p style="margin:4px 0 0;color:#888;font-size:12px;">&#8377;${item.price || 0} / kg</p>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding:14px 10px;text-align:center;vertical-align:middle;">
            <table cellpadding="2" cellspacing="0" style="margin:0 auto;">
              <tr><td style="color:#333;font-size:12px;white-space:nowrap;">${item.gramsperday}g / day</td></tr>
              <tr><td style="color:#333;font-size:12px;white-space:nowrap;">${item.dayspermonth} days</td></tr>
              <tr><td style="color:#333;font-size:12px;white-space:nowrap;">${item.familymembers} persons</td></tr>
            </table>
          </td>
          <td style="padding:14px 10px;color:#333;font-size:14px;text-align:center;vertical-align:middle;">${item.quantity || ""}</td>
          <td style="padding:14px 18px;color:#1a2c52;font-size:14px;font-weight:700;text-align:right;vertical-align:middle;">&#8377;${item.total || 0}</td>
        </tr>
        `,
        )
        .join("")}
      </table>
    </td>
  </tr>

  <!-- ORDER TOTALS -->
  <tr>
    <td style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde3ec;border-radius:0 0 7px 7px;border-top:none;overflow:hidden;">
        <tr>
          <td style="padding:12px 18px;">
            <table width="100%" cellpadding="6" cellspacing="0">
              <tr>
                <td style="color:#555;font-size:14px;">Subtotal</td>
                <td align="right" style="color:#333;font-size:14px;">&#8377;${ordersData?.subtotal || 0}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:14px;">Delivery Charges</td>
                <td align="right" style="color:#333;font-size:14px;">&#8377;${ordersData?.deliveryCharge || 0}</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:14px;">Tax</td>
                <td align="right" style="color:#333;font-size:14px;">&#8377;${ordersData?.tax || 0}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:4px 0;">
                  <hr style="border:none;border-top:2px dashed #dde3ec;margin:6px 0;"/>
                </td>
              </tr>
              <tr>
                <td style="color:#1a2c52;font-size:16px;font-weight:700;">Grand Total</td>
                <td align="right" style="color:${accent};font-size:18px;font-weight:800;">&#8377;${ordersData?.grandTotal || 0}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:0 32px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${accentLight};border-radius:7px;">
        <tr>
          <td style="padding:16px 20px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:14px;vertical-align:top;font-size:22px;color:${accent};">&#127911;</td>
                <td>
                  <p style="margin:0;color:#444;font-size:13px;">If you have any questions, feel free to contact our support team.</p>
                  <p style="margin:5px 0 0;color:#1a2c52;font-size:13px;font-weight:700;">Thank you for choosing healthy living!</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  };
};

export const sendEmail = async (to, subject, text, htmlContent) => {
  try {
    const senderMail = process.env.SMTP_MAIL || "dinesh@vidyutinfo.in";
    const mailOptions = {
      from: `"Tradizions" <${senderMail}>`,
      to: to || senderMail,
      subject: subject || "Notification from Tradizions",
      text: text || "Notification",
      replyTo: senderMail,
      html: htmlContent ? htmlContent : normalProductsOrder({}).html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email in sendEmail function:", error);
    return null;
  }
};

export const handleSendEmail = async (req, res) => {
  const { to, subject, text } = req.body;

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
