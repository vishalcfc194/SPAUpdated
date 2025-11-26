import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formatDateReadable = (isoDate) => {
  try {
    const d = new Date(isoDate);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return isoDate || "";
  }
};

// options: { action: 'open'|'print' }
export const generatePDFBill = async (bill, options = { action: "open" }) => {
  try {
    // normalize values from bill snapshot (server may return clientName/clientPhone etc.)
    const clientName =
      bill.clientName || bill.client || bill.clientNameRaw || bill.clientName;
    const clientPhone =
      bill.clientPhone || bill.clientPhoneRaw || bill.clientPhone || bill.phone;
    const clientAddress = bill.clientAddress || bill.address || "";
    const staffName =
      (bill.staff && (bill.staff.name || bill.staff)) || bill.staff || "";
    const dateStr = formatDateReadable(
      bill.dateFrom || bill.date || bill.createdAt || ""
    );

    // build items rows from bill.items
    const items = (bill.items || []).map((it) => {
      const name = it.service
        ? it.service.title || it.service.name || it.service
        : it.membership
        ? it.membership.name || it.membership
        : it.membershipName || it.serviceName || "Item";
      const qty = it.quantity || 1;
      const price = it.price || it.amount || 0;
      const amount = qty * price;
      return { name, qty, price, amount };
    });

    const subtotal =
      items.reduce((s, i) => s + (i.amount || 0), 0) || Number(bill.total || 0);

    // Richer HTML for full A4 page
    const invoiceHtml = `
      <div style="font-family: Poppins, Arial, sans-serif; padding:28px; background:white; width:794px; color:#222">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:14px;">
            <img src=\"/logo.png\" style=\"height:72px;\" alt=\"logo\" />
            <div>
              <div style="font-size:20px; font-weight:700; color:#1b5e20;">Cindrella The Family Spa</div>
              <div style="font-size:12px; color:#666;">Near IDBI Bank, Queen Place 2nd Floor</div>
              <div style="font-size:12px; color:#666;">Mobile: 7440534727</div>
            </div>
          </div>
          <div style="text-align:right; font-size:12px; color:#333;">
            <div><strong>Invoice</strong></div>
            <div style="margin-top:6px;">Date: ${dateStr}</div>
            <div>Invoice ID: ${bill._id || bill.id || "-"}</div>
          </div>
        </div>
        <hr style="margin:18px 0; border:none; border-top:1px solid #e6e6e6" />

        <div style="display:flex; justify-content:space-between; gap:20px;">
          <div style="flex:1;">
            <div style="font-weight:600; margin-bottom:6px">Billed To</div>
            <div>${clientName || "-"}</div>
            <div style="font-size:12px; color:#555;">${clientPhone || ""}</div>
            <div style="font-size:12px; color:#555;">${
              clientAddress || ""
            }</div>
          </div>
          <div style="width:260px; text-align:right;">
            <div style="font-weight:600; margin-bottom:6px">Service Details</div>
            <div style="font-size:13px;">Staff: ${staffName || "-"}</div>
            <div style="font-size:13px;">Time: ${
              bill.timeFrom || bill.from || ""
            } - ${bill.timeTo || bill.to || ""}</div>
          </div>
        </div>

        <table style="width:100%; margin-top:18px; border-collapse:collapse;">
          <thead>
            <tr style="background:#f7f7f7">
              <th style="text-align:left; padding:10px 8px; border-bottom:1px solid #e6e6e6">Description</th>
              <th style="text-align:center; padding:10px 8px; border-bottom:1px solid #e6e6e6">Qty</th>
              <th style="text-align:right; padding:10px 8px; border-bottom:1px solid #e6e6e6">Price</th>
              <th style="text-align:right; padding:10px 8px; border-bottom:1px solid #e6e6e6">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (i) => `
              <tr>
                <td style="padding:10px 8px; border-bottom:1px solid #f0f0f0">${i.name}</td>
                <td style="text-align:center; padding:10px 8px; border-bottom:1px solid #f0f0f0">${i.qty}</td>
                <td style="text-align:right; padding:10px 8px; border-bottom:1px solid #f0f0f0">₹${i.price}</td>
                <td style="text-align:right; padding:10px 8px; border-bottom:1px solid #f0f0f0">₹${i.amount}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-top:18px;">
          <div style="width:320px;">
            <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:13px;"><div>Subtotal</div><div>₹${subtotal}</div></div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:13px;"><div>Discount</div><div>₹${
              bill.discount || 0
            }</div></div>
            <div style="display:flex; justify-content:space-between; padding:8px 0; font-weight:700; font-size:16px; border-top:1px solid #ddd; margin-top:6px;"><div>Total</div><div>₹${
              bill.total || subtotal
            }</div></div>
          </div>
        </div>

        <div style="margin-top:28px; font-size:12px; color:#666; text-align:center">Thank you for choosing Cindrella The Family Spa — Relax, Rejuvenate, Repeat.</div>
      </div>
    `;

    // Create invisible wrapper and render to canvas
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.innerHTML = invoiceHtml;
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    if (options.action === "print") {
      pdf.autoPrint();
      const blobUrl = pdf.output("bloburl");
      window.open(blobUrl);
      document.body.removeChild(wrapper);
      return;
    }

    const blob = pdf.output("bloburl");
    window.open(blob, "_blank");
    document.body.removeChild(wrapper);
  } catch (e) {
    console.error("PDF generation error", e);
  }
};
