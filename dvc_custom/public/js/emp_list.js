// File: public/js/employee_list_simple.js
// Use this if you don't have background jobs configured

frappe.listview_settings['Employee'] = {
    onload: function(listview) {
        listview.page.add_inner_button(__('Rename All Employees'), function() {
            frappe.confirm(
                __('This will rename all Employee documents to use their Employee Number. This may take several minutes. Continue?'),
                function() {
                    start_chunked_rename();
                }
            );
        });
    }
};

function start_chunked_rename() {
    let progress_dialog = new frappe.ui.Dialog({
        title: __('Renaming Employees'),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'progress_area',
                options: '<div id="rename_progress"><p>Starting rename process...</p><div class="progress"><div class="progress-bar" style="width: 0%"></div></div></div>'
            }
        ],
        primary_action_label: __('Stop'),
        primary_action: function() {
            stop_rename = true;
            progress_dialog.hide();
        }
    });
    
    progress_dialog.show();
    
    let total_processed = 0;
    let total_success = 0;
    let total_errors = 0;
    let stop_rename = false;
    
    function process_next_chunk(start_index = 0) {
        if (stop_rename) {
            update_progress('Process stopped by user', 100, true);
            return;
        }
        
        frappe.call({
            method: 'dvc_custom.override.emp.rename_employees_by_chunks',
            args: {
                start_index: start_index,
                chunk_size: 100
            },
            callback: function(r) {
                if (r.message) {
                    let result = r.message;
                    
                    if (result.status === 'completed') {
                        update_progress(
                            `Rename completed! Total: ${total_success} successful, ${total_errors} errors`,
                            100,
                            true
                        );
                        cur_list.refresh();
                        return;
                    } else if (result.status === 'error') {
                        update_progress('Error: ' + result.message, 0, true);
                        return;
                    }
                    
                    // Update counters
                    total_processed += result.processed;
                    total_success += result.success_count;
                    total_errors += result.error_count;
                    
                    // Show progress
                    let progress_msg = `Processed: ${total_processed}, Success: ${total_success}, Errors: ${total_errors}`;
                    update_progress(progress_msg, 50, false); // We don't know total count, so show 50%
                    
                    // Process next chunk if there's more
                    if (result.has_more) {
                        setTimeout(function() {
                            process_next_chunk(result.next_start);
                        }, 500); // Small delay between chunks
                    } else {
                        update_progress(
                            `All done! Total: ${total_success} successful, ${total_errors} errors`,
                            100,
                            true
                        );
                        cur_list.refresh();
                    }
                }
            },
            error: function() {
                update_progress('Network error occurred', 0, true);
            }
        });
    }
    
    function update_progress(message, percent, show_stop) {
        let progress_area = progress_dialog.$wrapper.find('#rename_progress');
        progress_area.html(`
            <p>${message}</p>
            <div class="progress">
                <div class="progress-bar" style="width: ${percent}%">${percent > 0 ? percent + '%' : ''}</div>
            </div>
        `);
        
        if (show_stop) {
            progress_dialog.set_primary_action(__('Close'), function() {
                progress_dialog.hide();
            });
        }
    }
    
    // Start processing
    process_next_chunk(0);
}