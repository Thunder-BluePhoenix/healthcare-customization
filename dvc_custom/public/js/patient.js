frappe.ui.form.on('Patient', {

    refresh: function(frm) {
        if (frm.is_new()) {
            // Only set UID if it hasn't been set yet
            if (!frm.doc.uid || frm.doc.uid === '') {
                frappe.call({
                    method: "dvc_custom.override.patient.generate_uid",
                    args: {
                        "type_value": frm.doc.custom_type
                    },
                    callback: function(response) {
                        if (response.message) {
                            frm.set_value('uid', response.message);
                            frm.refresh_field('uid');
                        }
                    }
                });
                frappe.call({
                    method: "dvc_custom.override.patient.gen_fiscal_year",
                    args: {
                        "doc": frm.doc
                    },
                    callback: function(response) {
                        if (response.message) {
                            frm.set_value('custom_year', response.message);
                            frm.refresh_field('custom_year');
                        }
                    }
                });
            }
        }
    },
    custom_type: function(frm) {
        if (frm.is_new()) {
            // Only set UID if it hasn't been set yet
            
                frappe.call({
                    method: "dvc_custom.override.patient.generate_uid",
                    args: {
                        "type_value": frm.doc.custom_type
                    },
                    callback: function(response) {
                        if (response.message) {
                            frm.set_value('uid', response.message);
                            frm.refresh_field('uid');
                        }
                    }
                });

                frappe.call({
                    method: "dvc_custom.override.patient.gen_fiscal_year",
                    args: {
                        "doc": frm.doc
                    },
                    callback: function(response) {
                        if (response.message) {
                            frm.set_value('custom_year', response.message);
                            frm.refresh_field('custom_year');
                        }
                    }
                });
            
        }
    }
});