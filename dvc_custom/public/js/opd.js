frappe.ui.form.on('Patient Encounter', {
    refresh: function (frm) {
        frm.add_custom_button('Update Drug Prescriptions', () => {
            open_prescription_modal(frm);
        });
    }
});

function open_prescription_modal(frm) {
    const fields = [
        {
            fieldname: 'drug_table',
            label: 'Drug Prescriptions',
            fieldtype: 'HTML',
        }
    ];

    let d = new frappe.ui.Dialog({
        title: 'Edit Drug Prescriptions',
        size: 'extra-large',
        fields: fields,
        primary_action_label: 'Proceed',
        primary_action: function () {
            const updatedData = [];

            $(d.get_field('drug_table').wrapper)
                .find('tr.drug-row')
                .each(function () {
                    const name = $(this).data('name');
                    const given_qty = $(this).find('.given-qty').val();
                    const remarks = $(this).find('.remarks').val();
                    const cleared = $(this).find('.cleared').is(':checked') ? 1 : 0;

                    updatedData.push({
                        name,
                        custom_given_qty: given_qty,
                        custom_remarkspharmacy: remarks,
                        custom_clearedfrom_pharmacy: cleared,
                    });
                });

            frappe.call({
                method: 'dvc_custom.override.opd.update_drug_prescriptions',
                args: {
                    updates: updatedData
                },
                callback: function (r) {
                    if (r.message === 'success') {
                        frappe.show_alert('Drug Prescriptions Updated');
                        frm.reload_doc();
                        d.hide();
                    } else {
                        frappe.msgprint('Error updating prescriptions');
                    }
                }
            });
        }
    });

    const wrapper = d.get_field('drug_table').wrapper;
    $(wrapper).html(render_prescription_table(frm.doc.drug_prescription));
    d.show();
}

function render_prescription_table(prescriptions) {
    let html = `<table class="table table-bordered">
        <thead>
            <tr>
                <th>Drug Code</th>
                <th>Drug Name</th>
                <th>Strength</th>
                <th>Prescribed Qty</th>
                <th>Given Qty</th>
                <th>Pharmacy Remarks</th>
                <th>Cleared</th>
            </tr>
        </thead>
        <tbody>`;

    prescriptions.forEach(row => {
        html += `
            <tr class="drug-row" data-name="${row.name}">
                <td>${row.drug_code || ''}</td>
                <td>${row.drug_name || ''}</td>
                <td>${row.strength || ''}</td>
                <td>${row.custom_prescribed_qtyby_doctor || ''}</td>
                <td><input type="text" class="form-control given-qty" value="${row.custom_given_qty || ''}"/></td>
                <td><input type="text" class="form-control remarks" value="${row.custom_remarkspharmacy || ''}"/></td>
                <td><input type="checkbox" class="cleared" ${row.custom_clearedfrom_pharmacy ? 'checked' : ''}/></td>
            </tr>`;
    });

    html += '</tbody></table>';
    return html;
}
