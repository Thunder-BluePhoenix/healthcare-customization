// // File: public/js/employee_list_complete.js
// // This will process ALL employees with accurate progress

// frappe.listview_settings['Employee'] = {
//     onload: function(listview) {
//         listview.page.add_inner_button(__('Rename All Employees'), function() {
//             frappe.confirm(
//                 __('This will rename all Employee documents to use their Employee Number. This may take several minutes. Continue?'),
//                 function() {
//                     start_complete_rename();
//                 }
//             );
//         })
//         .css({
//                 'background-color': '#FF4F0F',  // Cyan background
//                 'color': 'white',              // Black text
//                 'border': 'none',             // No border
//                 'transition': 'background-color 0.3s ease'  // Smooth transition (optional)
//             });
//     }
// };

// function start_complete_rename() {
//     // First, get the total count of employees that need renaming
//     frappe.call({
//         method: 'dvc_custom.override.emp.get_employees_to_rename_count',
//         callback: function(r) {
//             if (r.message && r.message.total > 0) {
//                 start_chunked_rename_with_total(r.message.total, r.message.preview);
//             } else {
//                 frappe.msgprint(__('No employees need renaming'));
//             }
//         }
//     });
// }

// function start_chunked_rename_with_total(total_count, preview_list) {
//     let progress_dialog = new frappe.ui.Dialog({
//         title: __('Renaming Employees'),
//         fields: [
//             {
//                 fieldtype: 'HTML',
//                 fieldname: 'progress_area',
//                 options: `
//                     <div id="rename_progress">
//                         <p>Found ${total_count} employees to rename</p>
//                         <div class="preview" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
//                             <strong>Preview of changes:</strong><br>
//                             ${preview_list.map(emp => `${emp.current} → ${emp.new}`).join('<br>')}
//                             ${preview_list.length < total_count ? `<br>... and ${total_count - preview_list.length} more` : ''}
//                         </div>
//                         <p id="status_text">Starting rename process...</p>
//                         <div class="progress" style="margin: 10px 0;">
//                             <div class="progress-bar progress-bar-success" id="progress_bar" style="width: 0%">0%</div>
//                         </div>
//                         <div id="stats" style="transition: all 0.3s ease;">
//                             <small>
//                                 <span class="stat-item">
//                                     <i class="fa fa-cog fa-spin" style="color: #007bff;"></i>
//                                     Processed: <span id="processed_count" class="counter">0</span>
//                                 </span> | 
//                                 <span class="stat-item">
//                                     <i class="fa fa-check-circle" style="color: #28a745;"></i>
//                                     Success: <span id="success_count" class="counter">0</span>
//                                 </span> | 
//                                 <span class="stat-item">
//                                     <i class="fa fa-exclamation-triangle" style="color: #dc3545;"></i>
//                                     Errors: <span id="error_count" class="counter">0</span>
//                                 </span>
//                             </small>
                            
//                             <!-- Gradient Processing Loader -->
//                             <div id="processing_loader" style="margin: 10px 0; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; position: relative;">
//                                 <div class="gradient-loader"></div>
//                             </div>
//                             <div id="processing_text" style="text-align: center; font-size: 11px; color: #666; margin-top: 5px;">
//                                 <i class="fa fa-circle-o-notch fa-spin" style="margin-right: 5px;"></i>
//                                 Processing employees...
//                             </div>
                            
//                             <style>
//                                 .stat-item { 
//                                     display: inline-block; 
//                                     margin: 0 5px; 
//                                     padding: 2px 5px;
//                                     border-radius: 3px;
//                                     transition: background-color 0.3s ease;
//                                 }
//                                 .counter { 
//                                     font-weight: bold; 
//                                     font-size: 1.1em;
//                                     transition: all 0.3s ease;
//                                 }
//                                 .counter-update {
//                                     background-color: #fff3cd !important;
//                                     transform: scale(1.1);
//                                     border-radius: 3px;
//                                     padding: 1px 3px;
//                                 }
//                                 @keyframes pulse {
//                                     0% { transform: scale(1); }
//                                     50% { transform: scale(1.05); }
//                                     100% { transform: scale(1); }
//                                 }
//                                 .pulse { animation: pulse 0.5s ease-in-out; }
                                
//                                 /* Gradient Loader Animation */
//                                 .gradient-loader {
//                                     height: 100%;
//                                     width: 100%;
//                                     background: linear-gradient(90deg, 
//                                         transparent,
//                                         rgba(0, 123, 255, 0.2),
//                                         rgba(0, 123, 255, 0.5),
//                                         rgba(40, 167, 69, 0.5),
//                                         rgba(40, 167, 69, 0.2),
//                                         transparent
//                                     );
//                                     background-size: 200% 100%;
//                                     animation: gradient-slide 2s infinite;
//                                     border-radius: 3px;
//                                 }
                                
//                                 @keyframes gradient-slide {
//                                     0% { background-position: -200% 0; }
//                                     100% { background-position: 200% 0; }
//                                 }
                                
//                                 /* Pulsing dots animation */
//                                 @keyframes dots {
//                                     0%, 20% { content: '.'; }
//                                     40% { content: '..'; }
//                                     60% { content: '...'; }
//                                     80%, 100% { content: ''; }
//                                 }
                                
//                                 #processing_text:after {
//                                     content: '';
//                                     animation: dots 2s infinite;
//                                 }
                                
//                                 /* Completion styles */
//                                 .loader-completed {
//                                     background: linear-gradient(90deg, 
//                                         rgba(40, 167, 69, 0.8),
//                                         rgba(40, 167, 69, 0.6),
//                                         rgba(40, 167, 69, 0.8)
//                                     ) !important;
//                                     animation: none !important;
//                                 }
                                
//                                 .processing-completed {
//                                     color: #28a745 !important;
//                                 }
//                             </style>
//                         </div>
//                         <div id="error_log" style="max-height: 100px; overflow-y: auto; margin-top: 10px;"></div>
//                     </div>
//                 `
//             }
//         ],
//         primary_action_label: __('Stop'),
//         primary_action: function() {
//             frappe.confirm(
//                 __('Are you sure you want to stop the renaming process? Any employees already processed will remain renamed, but the remaining ones will not be processed.'),
//                 function() {
//                     stop_rename = true;
//                     progress_dialog.hide();
//                     frappe.show_alert({
//                         message: __('Renaming process stopped by user'),
//                         indicator: 'orange'
//                     });
//                 }
//             );
//         }
//     });
    
//     // Make the stop button red
//     progress_dialog.show();
//     progress_dialog.$wrapper.find('.btn-primary').removeClass('btn-primary').addClass('btn-danger');
    
//     let total_processed = 0;
//     let total_success = 0;
//     let total_errors = 0;
//     let stop_rename = false;
//     let all_errors = [];
    
//     function process_next_chunk(start_index = 0) {
//         if (stop_rename) {
//             update_progress('Process stopped by user', 100, true);
//             return;
//         }
        
//         update_status(`Processing chunk starting at ${start_index}...`);
        
//         frappe.call({
//             method: 'dvc_custom.override.emp.rename_employees_by_chunks',
//             args: {
//                 start_index: start_index,
//                 chunk_size: 50  // Smaller chunks for better progress updates
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     let result = r.message;
                    
//                     if (result.status === 'error') {
//                         update_progress('Error: ' + result.message, 0, true);
//                         return;
//                     }
                    
//                     // Update counters
//                     total_processed += result.processed;
//                     total_success += result.success_count;
//                     total_errors += result.error_count;
                    
//                     // Add new errors to log
//                     if (result.errors && result.errors.length > 0) {
//                         all_errors = all_errors.concat(result.errors);
//                         update_error_log();
//                     }
                    
//                     // Calculate progress percentage
//                     let progress_percent = Math.round((total_processed / total_count) * 100);
                    
//                     // Update progress display
//                     update_progress_display(progress_percent);
//                     update_stats(total_processed, total_success, total_errors);
                    
//                     // Check if we're done
//                     if (result.status === 'completed' || !result.has_more || total_processed >= total_count) {
//                         update_status(`Rename completed! Total: ${total_success} successful, ${total_errors} errors`);
//                         update_progress_display(100);
//                         show_completion_button();
//                         cur_list.refresh();
//                         return;
//                     }
                    
//                     // Process next chunk with a small delay
//                     setTimeout(function() {
//                         process_next_chunk(result.next_start);
//                     }, 300); // 300ms delay between chunks
//                 }
//             },
//             error: function() {
//                 update_progress('Network error occurred', 0, true);
//             }
//         });
//     }
    
//     function update_status(message) {
//         progress_dialog.$wrapper.find('#status_text').text(message);
//     }
    
//     function update_progress_display(percent) {
//         let progress_bar = progress_dialog.$wrapper.find('#progress_bar');
//         progress_bar.css('width', percent + '%').text(percent + '%');
//     }
    
//     function update_stats(processed, success, errors) {
//         // Add animation to updated counters
//         function animate_counter(element, new_value) {
//             let $element = progress_dialog.$wrapper.find(element);
//             let old_value = parseInt($element.text()) || 0;
            
//             if (new_value !== old_value) {
//                 // Add highlight effect
//                 $element.addClass('counter-update');
//                 $element.parent().addClass('pulse');
                
//                 // Update the value
//                 $element.text(new_value);
                
//                 // Remove effects after animation
//                 setTimeout(function() {
//                     $element.removeClass('counter-update');
//                     $element.parent().removeClass('pulse');
//                 }, 600);
//             }
//         }
        
//         animate_counter('#processed_count', processed);
//         animate_counter('#success_count', success);
//         animate_counter('#error_count', errors);
        
//         // Make the stats section pulse briefly
//         progress_dialog.$wrapper.find('#stats').addClass('pulse');
//         setTimeout(function() {
//             progress_dialog.$wrapper.find('#stats').removeClass('pulse');
//         }, 500);
//     }
    
//     function update_error_log() {
//         if (all_errors.length > 0) {
//             let error_html = '<div style="color: red; font-size: 11px;"><strong>Recent Errors:</strong><br>' + 
//                            all_errors.slice(-5).join('<br>') + '</div>';
//             progress_dialog.$wrapper.find('#error_log').html(error_html);
//         }
//     }
    
//     function update_progress(message, percent, show_stop) {
//         update_status(message);
//         update_progress_display(percent);
        
//         if (show_stop) {
//             show_completion_button();
//         } else {
//             // Update processing text with current activity
//             let processing_messages = [
//                 "Processing employees...",
//                 "Renaming documents...", 
//                 "Updating references...",
//                 "Validating changes..."
//             ];
//             let random_message = processing_messages[Math.floor(Math.random() * processing_messages.length)];
//             progress_dialog.$wrapper.find('#processing_text').html(`<i class="fa fa-circle-o-notch fa-spin" style="margin-right: 5px;"></i>${random_message}`);
//         }
//     }
    
//     function show_completion_button() {
//         // Stop the spinning icon when completed
//         progress_dialog.$wrapper.find('.fa-spin').removeClass('fa-spin').removeClass('fa-cog').addClass('fa-check');
        
//         // Update the gradient loader to show completion
//         progress_dialog.$wrapper.find('.gradient-loader').addClass('loader-completed');
//         progress_dialog.$wrapper.find('#processing_text').html('<i class="fa fa-check-circle" style="margin-right: 5px; color: #28a745;"></i>Processing completed!').addClass('processing-completed');
        
//         progress_dialog.set_primary_action(__('Close'), function() {
//             progress_dialog.hide();
//         });
        
//         // Make the close button green
//         progress_dialog.$wrapper.find('.btn-danger').removeClass('btn-danger').addClass('btn-success');
//     }
    
//     // Start processing
//     process_next_chunk(0);
// }









// File: public/js/employee_list_with_options.js
// Main rename button with multiple options including auto-generated naming series

// frappe.listview_settings['Employee'] = {
//     onload: function(listview) {
//         listview.page.add_inner_button(__('Rename Employees'), function() {
//             show_rename_options_dialog();
//         }).css({
//                 'background-color': '#FF4F0F',  // Cyan background
//                 'color': 'white',              // Black text
//                 'border': 'none',             // No border
//                 'transition': 'background-color 0.3s ease'  // Smooth transition (optional)
//             });
//     }
// };
// File: public/js/employee_list_with_options.js
// Main rename button with multiple options including auto-generated naming series

frappe.listview_settings['Employee'] = {
    onload: function(listview) {
        listview.page.add_inner_button(__('Rename Employees'), function() {
            show_rename_options_dialog();
        }).css({
                'background-color': '#FF4F0F',  // Cyan background
                'color': 'white',              // Black text
                'border': 'none',             // No border
                'transition': 'background-color 0.3s ease'  // Smooth transition (optional)
            });
    }
};

function show_rename_options_dialog() {
    let options_dialog = new frappe.ui.Dialog({
        title: __('Employee Rename Options'),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'options_intro',
                options: `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h5 style="margin-bottom: 10px; color: #495057;">Choose Rename Method:</h5>
                        <p style="margin: 0; color: #6c757d;">Select how you want to rename your employee records.</p>
                    </div>
                `
            },
            {
                fieldtype: 'HTML',
                fieldname: 'rename_options',
                options: `
                    <div style="display: grid; gap: 15px;">
                        <!-- Option 1: Employee Number -->
                        <div class="rename-option-card" data-option="employee_number" style="border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <i class="fa fa-id-card" style="font-size: 24px; color: #007bff; margin-right: 15px;"></i>
                                <h6 style="margin: 0; color: #495057;">Use Employee Number</h6>
                            </div>
                            <p style="margin: 5px 0 0 39px; color: #6c757d; font-size: 13px;">
                                Rename all employees to use their existing Employee Number.<br>
                                <strong>Example:</strong> John Doe → EMP001
                            </p>
                        </div>

                        <!-- Option 2: Auto-Generated Naming Series -->
                        <div class="rename-option-card" data-option="naming_series" style="border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <i class="fa fa-magic" style="font-size: 24px; color: #28a745; margin-right: 15px;"></i>
                                <h6 style="margin: 0; color: #495057;">Auto-Generated Naming Series</h6>
                            </div>
                            <p style="margin: 5px 0 0 39px; color: #6c757d; font-size: 13px;">
                                Generate new names using automatic numbering with custom prefix.<br>
                                <strong>Example:</strong> EMP-2025-0001, HR-001, STAFF-001
                            </p>
                        </div>

                        <!-- Option 3: Custom Format -->
                        <div class="rename-option-card" data-option="custom_format" style="border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <i class="fa fa-edit" style="font-size: 24px; color: #ffc107; margin-right: 15px;"></i>
                                <h6 style="margin: 0; color: #495057;">Custom Format Pattern</h6>
                            </div>
                            <p style="margin: 5px 0 0 39px; color: #6c757d; font-size: 13px;">
                                Create custom format using employee data variables.<br>
                                <strong>Example:</strong> {department}_{employee_number}, {company}-{first_name}
                            </p>
                        </div>
                    </div>

                    <style>
                        .rename-option-card:hover {
                            border-color: #007bff !important;
                            background-color: #f8f9fa !important;
                            transform: translateY(-2px);
                            box-shadow: 0 4px 8px rgba(0,123,255,0.15);
                        }
                        .rename-option-card.selected {
                            border-color: #007bff !important;
                            background-color: #e7f3ff !important;
                        }
                    </style>
                `
            }
        ],
        primary_action_label: __('Next'),
        primary_action: function() {
            let selected_option = options_dialog.$wrapper.find('.rename-option-card.selected').data('option');
            if (!selected_option) {
                frappe.msgprint(__('Please select a rename option'));
                return;
            }
            
            options_dialog.hide();
            
            switch(selected_option) {
                case 'employee_number':
                    start_employee_number_rename();
                    break;
                case 'naming_series':
                    show_naming_series_dialog();
                    break;
                case 'custom_format':
                    show_custom_format_dialog();
                    break;
            }
        }
    });
    
    options_dialog.show();
    
    // Add click handlers for option cards
    options_dialog.$wrapper.find('.rename-option-card').on('click', function() {
        options_dialog.$wrapper.find('.rename-option-card').removeClass('selected');
        $(this).addClass('selected');
    });
}

function show_naming_series_dialog() {
    let naming_dialog = new frappe.ui.Dialog({
        title: __('Auto-Generated Naming Series'),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'naming_help',
                options: `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                        <h5>Naming Series Format:</h5>
                        <ul style="margin: 10px 0;">
                            <li><code>prefix</code> - Fixed text (e.g., EMP, STAFF, HR)</li>
                            <li><code>YYYY</code> - Current year (2025)</li>
                            <li><code>MM</code> - Current month (01-12)</li>
                            <li><code>DD</code> - Current day (01-31)</li>
                            <li><code>####</code> - Auto number with padding</li>
                        </ul>
                        <p><strong>Examples:</strong></p>
                        <ul>
                            <li><code>EMP-.####</code> → EMP-0001, EMP-0002, EMP-0003</li>
                            <li><code>STAFF-YYYY-.####</code> → STAFF-2025-0001, STAFF-2025-0002</li>
                            <li><code>HR-.MM.-.####</code> → HR-01-0001, HR-01-0002</li>
                            <li><code>EMP-YYYY-MM-.####</code> → EMP-2025-01-0001</li>
                        </ul>
                    </div>
                `
            },
            {
                fieldtype: 'Data',
                fieldname: 'naming_series',
                label: __('Naming Series Pattern'),
                reqd: 1,
                default: 'EMP-.####',
                description: __('Use . to separate parts, #### for auto numbers')
            },
            {
                fieldtype: 'Int',
                fieldname: 'start_number',
                label: __('Starting Number'),
                default: 1,
                description: __('First number to start counting from')
            },
            {
                fieldtype: 'Section Break'
            },
            {
                fieldtype: 'HTML',
                fieldname: 'naming_preview',
                options: '<div id="naming_preview_area" style="margin-top: 10px;"></div>'
            }
        ],
        primary_action_label: __('Preview'),
        primary_action: function(values) {
            if (values.naming_series) {
                show_naming_preview(values.naming_series, values.start_number, naming_dialog);
            }
        }
    });
    
    naming_dialog.show();
    
    // Rearrange buttons - move Preview to left, Apply to right
    let $footer = naming_dialog.$wrapper.find('.modal-footer');
    let $previewBtn = $footer.find('.btn-primary');
    
    // Clear footer and rebuild with proper order
    $footer.empty();
    
    // Add Preview button on the left (secondary style)
    $footer.append(`
        <button class="btn btn-secondary btn-preview-naming">
            ${__('Preview')}
        </button>
    `);
    
    // Add Apply button on the right (success style)
    $footer.append(`
        <button class="btn btn-success btn-apply-naming" style="margin-left: auto;">
            ${__('Apply Naming Series')}
        </button>
    `);
    
    // Handle Preview button click
    naming_dialog.$wrapper.find('.btn-preview-naming').on('click', function() {
        let values = naming_dialog.get_values();
        if (values.naming_series) {
            show_naming_preview(values.naming_series, values.start_number, naming_dialog);
        } else {
            frappe.msgprint(__('Please enter a naming series pattern'));
        }
    });
    
    // Handle Apply button click
    naming_dialog.$wrapper.find('.btn-apply-naming').on('click', function() {
        let values = naming_dialog.get_values();
        if (values.naming_series) {
            frappe.confirm(
                __('This will rename all employees using the naming series: <br><code>{0}</code><br>Starting from: {1}<br><br>This action cannot be undone easily. Continue?', 
                   [values.naming_series, values.start_number]),
                function() {
                    naming_dialog.hide();
                    start_naming_series_rename(values.naming_series, values.start_number);
                }
            );
        } else {
            frappe.msgprint(__('Please enter a naming series pattern'));
        }
    });
    
    // Real-time preview
    naming_dialog.$wrapper.find('[data-fieldname="naming_series"] input, [data-fieldname="start_number"] input').on('input', function() {
        let series = naming_dialog.get_value('naming_series');
        let start_num = naming_dialog.get_value('start_number') || 1;
        if (series) {
            show_naming_preview(series, start_num, naming_dialog);
        }
    });
}

function show_naming_preview(naming_series, start_number, dialog) {
    console.log('Showing naming preview:', naming_series, start_number);
    
    frappe.call({
        method: 'dvc_custom.override.emp.preview_naming_series',
        args: {
            naming_series: naming_series,
            start_number: start_number,
            limit: 5
        },
        callback: function(r) {
            console.log('Naming preview response:', r);
            if (r.message) {
                let preview_html = '<h6>Preview (first 5 employees):</h6>';
                if (r.message.success) {
                    preview_html += '<div style="background: #d4edda; padding: 10px; border-radius: 3px;">';
                    r.message.preview.forEach(function(item) {
                        preview_html += `<div><strong>Current:</strong> ${item.current} → <strong>New:</strong> ${item.new}</div>`;
                    });
                    preview_html += `</div><p><small>Total employees to rename: ${r.message.total_count}</small></p>`;
                } else {
                    preview_html += `<div style="background: #f8d7da; padding: 10px; border-radius: 3px; color: #721c24;">
                        <strong>Error:</strong> ${r.message.error}
                    </div>`;
                }
                dialog.$wrapper.find('#naming_preview_area').html(preview_html);
            }
        },
        error: function(r) {
            console.error('Naming preview error:', r);
            dialog.$wrapper.find('#naming_preview_area').html(`
                <div style="background: #f8d7da; padding: 10px; border-radius: 3px; color: #721c24;">
                    <strong>Error:</strong> ${r.message || 'Unknown error occurred'}
                </div>
            `);
        }
    });
}

function start_employee_number_rename() {
    frappe.call({
        method: 'dvc_custom.override.emp.get_employees_to_rename_count',
        callback: function(r) {
            if (r.message && r.message.total > 0) {
                start_chunked_rename_with_total(r.message.total, r.message.preview, 'employee_number');
            } else {
                frappe.msgprint(__('No employees need renaming'));
            }
        }
    });
}

function start_naming_series_rename(naming_series, start_number) {
    console.log('Starting naming series rename:', naming_series, start_number);
    
    frappe.call({
        method: 'dvc_custom.override.emp.get_naming_series_count',
        args: {
            naming_series: naming_series,
            start_number: start_number
        },
        callback: function(r) {
            console.log('Naming series count response:', r);
            if (r.message && r.message.total > 0) {
                start_chunked_rename_with_total(r.message.total, r.message.preview, 'naming_series', {
                    naming_series: naming_series,
                    start_number: start_number
                });
            } else {
                frappe.msgprint(__('No employees found to rename'));
            }
        },
        error: function(r) {
            console.error('Naming series count error:', r);
            frappe.msgprint(__('Error getting employee count: ') + (r.message || 'Unknown error'));
        }
    });
}

function show_custom_format_dialog() {
    let format_dialog = new frappe.ui.Dialog({
        title: __('Custom Employee Name Format'),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'format_help',
                options: `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                        <h5>Available Format Variables:</h5>
                        <ul style="margin: 10px 0;">
                            <li><code>{employee_number}</code> - Employee Number (e.g., EMP001)</li>
                            <li><code>{first_name}</code> - First Name</li>
                            <li><code>{last_name}</code> - Last Name</li>
                            <li><code>{full_name}</code> - Full Name</li>
                            <li><code>{department}</code> - Department</li>
                            <li><code>{designation}</code> - Designation</li>
                            <li><code>{company}</code> - Company</li>
                        </ul>
                        <p><strong>Examples:</strong></p>
                        <ul>
                            <li><code>{employee_number} - {full_name}</code> → EMP001 - John Doe</li>
                            <li><code>{department}_{employee_number}</code> → HR_EMP001</li>
                            <li><code>{company}-{employee_number}-{last_name}</code> → ABC Corp-EMP001-Doe</li>
                        </ul>
                    </div>
                `
            },
            {
                fieldtype: 'Data',
                fieldname: 'format_pattern',
                label: __('Format Pattern'),
                reqd: 1,
                default: '{employee_number}',
                description: __('Use variables in curly braces {}')
            },
            {
                fieldtype: 'Section Break'
            },
            {
                fieldtype: 'HTML',
                fieldname: 'preview_area',
                options: '<div id="format_preview" style="margin-top: 10px;"></div>'
            }
        ],
        primary_action_label: __('Preview Format'),
        primary_action: function(values) {
            if (values.format_pattern) {
                show_format_preview(values.format_pattern, format_dialog);
            }
        }
    });
    
    format_dialog.show();
    
    // Rearrange buttons - move Preview to left, Apply to right
    let $footer = format_dialog.$wrapper.find('.modal-footer');
    
    // Clear footer and rebuild with proper order
    $footer.empty();
    
    // Add Preview button on the left (secondary style)
    $footer.append(`
        <button class="btn btn-secondary btn-preview-format">
            ${__('Preview Format')}
        </button>
    `);
    
    // Add Apply button on the right (success style)
    $footer.append(`
        <button class="btn btn-success btn-apply-format" style="margin-left: auto;">
            ${__('Apply Format')}
        </button>
    `);
    
    // Handle Preview button click
    format_dialog.$wrapper.find('.btn-preview-format').on('click', function() {
        let values = format_dialog.get_values();
        if (values.format_pattern) {
            show_format_preview(values.format_pattern, format_dialog);
        } else {
            frappe.msgprint(__('Please enter a format pattern'));
        }
    });
    
    // Handle Apply button click
    format_dialog.$wrapper.find('.btn-apply-format').on('click', function() {
        let values = format_dialog.get_values();
        if (values.format_pattern) {
            frappe.confirm(
                __('This will rename all Employee documents using the format: <br><code>{0}</code><br><br>This action cannot be undone easily. Continue?', [values.format_pattern]),
                function() {
                    format_dialog.hide();
                    start_custom_format_rename(values.format_pattern);
                }
            );
        } else {
            frappe.msgprint(__('Please enter a format pattern'));
        }
    });
    
    // Real-time preview
    format_dialog.$wrapper.find('[data-fieldname="format_pattern"] input').on('input', function() {
        let pattern = $(this).val();
        if (pattern) {
            show_format_preview(pattern, format_dialog);
        }
    });
}

function show_format_preview(pattern, dialog) {
    console.log('Showing format preview:', pattern);
    
    frappe.call({
        method: 'dvc_custom.override.emp.preview_custom_format',
        args: {
            format_pattern: pattern,
            limit: 5
        },
        callback: function(r) {
            console.log('Format preview response:', r);
            if (r.message) {
                let preview_html = '<h6>Preview (first 5 employees):</h6>';
                if (r.message.success) {
                    preview_html += '<div style="background: #d4edda; padding: 10px; border-radius: 3px;">';
                    r.message.preview.forEach(function(item) {
                        preview_html += `<div><strong>Current:</strong> ${item.current} → <strong>New:</strong> ${item.new}</div>`;
                    });
                    preview_html += `</div><p><small>Total employees to rename: ${r.message.total_count}</small></p>`;
                } else {
                    preview_html += `<div style="background: #f8d7da; padding: 10px; border-radius: 3px; color: #721c24;">
                        <strong>Error:</strong> ${r.message.error}
                    </div>`;
                }
                dialog.$wrapper.find('#format_preview').html(preview_html);
            }
        },
        error: function(r) {
            console.error('Format preview error:', r);
            dialog.$wrapper.find('#format_preview').html(`
                <div style="background: #f8d7da; padding: 10px; border-radius: 3px; color: #721c24;">
                    <strong>Error:</strong> ${r.message || 'Unknown error occurred'}
                </div>
            `);
        }
    });
}

function start_custom_format_rename(format_pattern) {
    console.log('Starting custom format rename:', format_pattern);
    
    frappe.call({
        method: 'dvc_custom.override.emp.get_custom_format_count',
        args: {
            format_pattern: format_pattern
        },
        callback: function(r) {
            console.log('Custom format count response:', r);
            if (r.message && r.message.total > 0) {
                start_chunked_rename_with_total(r.message.total, r.message.preview, 'custom_format', {
                    format_pattern: format_pattern
                });
            } else {
                frappe.msgprint(__('No employees need renaming with this format'));
            }
        },
        error: function(r) {
            console.error('Custom format count error:', r);
            frappe.msgprint(__('Error getting employee count: ') + (r.message || 'Unknown error'));
        }
    });
}

function start_chunked_rename_with_total(total_count, preview_list, rename_type, options = {}) {
    let title_text = 'Renaming Employees';
    let description_text = 'Processing employees...';
    
    switch(rename_type) {
        case 'employee_number':
            title_text = 'Employee Number Renaming';
            description_text = 'Renaming to Employee Numbers';
            break;
        case 'naming_series':
            title_text = 'Auto-Generated Naming';
            description_text = `Applying naming series: ${options.naming_series}`;
            break;
        case 'custom_format':
            title_text = 'Custom Format Renaming';
            description_text = `Applying format: ${options.format_pattern}`;
            break;
    }
    
    let progress_dialog = new frappe.ui.Dialog({
        title: __(title_text),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'progress_area',
                options: `
                    <div id="rename_progress">
                        <p>${description_text}</p>
                        <p>Found ${total_count} employees to rename</p>
                        <div class="preview" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
                            <strong>Preview of changes:</strong><br>
                            ${preview_list.map(emp => `${emp.current} → ${emp.new}`).join('<br>')}
                            ${preview_list.length < total_count ? `<br>... and ${total_count - preview_list.length} more` : ''}
                        </div>
                        <p id="status_text">Starting rename process...</p>
                        <div class="progress" style="margin: 10px 0;">
                            <div class="progress-bar progress-bar-success" id="progress_bar" style="width: 0%">0%</div>
                        </div>
                        <div id="stats" style="transition: all 0.3s ease;">
                            <small>
                                <span class="stat-item">
                                    <i class="fa fa-cog fa-spin" style="color: #007bff;"></i>
                                    Processed: <span id="processed_count" class="counter">0</span>
                                </span> | 
                                <span class="stat-item">
                                    <i class="fa fa-check-circle" style="color: #28a745;"></i>
                                    Success: <span id="success_count" class="counter">0</span>
                                </span> | 
                                <span class="stat-item">
                                    <i class="fa fa-exclamation-triangle" style="color: #dc3545;"></i>
                                    Errors: <span id="error_count" class="counter">0</span>
                                </span>
                            </small>
                            
                            <div id="processing_loader" style="margin: 10px 0; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; position: relative;">
                                <div class="gradient-loader"></div>
                            </div>
                            <div id="processing_text" style="text-align: center; font-size: 11px; color: #666; margin-top: 5px;">
                                <i class="fa fa-circle-o-notch fa-spin" style="margin-right: 5px;"></i>
                                Processing employees...
                            </div>
                            
                            <style>
                                .stat-item { 
                                    display: inline-block; 
                                    margin: 0 5px; 
                                    padding: 2px 5px;
                                    border-radius: 3px;
                                    transition: background-color 0.3s ease;
                                }
                                .counter { 
                                    font-weight: bold; 
                                    font-size: 1.1em;
                                    transition: all 0.3s ease;
                                }
                                .counter-update {
                                    background-color: #fff3cd !important;
                                    transform: scale(1.1);
                                    border-radius: 3px;
                                    padding: 1px 3px;
                                }
                                @keyframes pulse {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.05); }
                                    100% { transform: scale(1); }
                                }
                                .pulse { animation: pulse 0.5s ease-in-out; }
                                
                                .gradient-loader {
                                    height: 100%;
                                    width: 100%;
                                    background: linear-gradient(90deg, 
                                        transparent,
                                        rgba(0, 123, 255, 0.2),
                                        rgba(0, 123, 255, 0.5),
                                        rgba(40, 167, 69, 0.5),
                                        rgba(40, 167, 69, 0.2),
                                        transparent
                                    );
                                    background-size: 200% 100%;
                                    animation: gradient-slide 2s infinite;
                                    border-radius: 3px;
                                }
                                
                                @keyframes gradient-slide {
                                    0% { background-position: -200% 0; }
                                    100% { background-position: 200% 0; }
                                }
                                
                                @keyframes dots {
                                    0%, 20% { content: '.'; }
                                    40% { content: '..'; }
                                    60% { content: '...'; }
                                    80%, 100% { content: ''; }
                                }
                                
                                #processing_text:after {
                                    content: '';
                                    animation: dots 2s infinite;
                                }
                                
                                .loader-completed {
                                    background: linear-gradient(90deg, 
                                        rgba(40, 167, 69, 0.8),
                                        rgba(40, 167, 69, 0.6),
                                        rgba(40, 167, 69, 0.8)
                                    ) !important;
                                    animation: none !important;
                                }
                                
                                .processing-completed {
                                    color: #28a745 !important;
                                }
                            </style>
                        </div>
                        <div id="error_log" style="max-height: 100px; overflow-y: auto; margin-top: 10px;"></div>
                    </div>
                `
            }
        ],
        primary_action_label: __('Stop'),
        primary_action: function() {
            frappe.confirm(
                __('Are you sure you want to stop the renaming process? Any employees already processed will remain renamed, but the remaining ones will not be processed.'),
                function() {
                    stop_rename = true;
                    progress_dialog.hide();
                    frappe.show_alert({
                        message: __('Renaming process stopped by user'),
                        indicator: 'orange'
                    });
                }
            );
        }
    });
    
    progress_dialog.show();
    progress_dialog.$wrapper.find('.btn-primary').removeClass('btn-primary').addClass('btn-danger');
    
    let total_processed = 0;
    let total_success = 0;
    let total_errors = 0;
    let stop_rename = false;
    let all_errors = [];
    
    function process_next_chunk(start_index = 0) {
        if (stop_rename) {
            update_progress('Process stopped by user', 100, true);
            return;
        }
        
        update_status(`Processing chunk starting at ${start_index}...`);
        
        let method_name = '';
        let method_args = {
            start_index: start_index,
            chunk_size: 50
        };
        
        switch(rename_type) {
            case 'employee_number':
                method_name = 'dvc_custom.override.emp.rename_employees_by_chunks';
                break;
            case 'naming_series':
                method_name = 'dvc_custom.override.emp.rename_employees_naming_series';
                method_args.naming_series = options.naming_series;
                method_args.start_number = options.start_number;
                break;
            case 'custom_format':
                method_name = 'dvc_custom.override.emp.rename_employees_custom_format';
                method_args.format_pattern = options.format_pattern;
                break;
        }
        
        frappe.call({
            method: method_name,
            args: method_args,
            callback: function(r) {
                if (r.message) {
                    let result = r.message;
                    
                    if (result.status === 'error') {
                        update_progress('Error: ' + result.message, 0, true);
                        return;
                    }
                    
                    total_processed += result.processed;
                    total_success += result.success_count;
                    total_errors += result.error_count;
                    
                    if (result.errors && result.errors.length > 0) {
                        all_errors = all_errors.concat(result.errors);
                        update_error_log();
                    }
                    
                    let progress_percent = Math.round((total_processed / total_count) * 100);
                    update_progress_display(progress_percent);
                    update_stats(total_processed, total_success, total_errors);
                    
                    if (result.status === 'completed' || !result.has_more || total_processed >= total_count) {
                        update_status(`Rename completed! Total: ${total_success} successful, ${total_errors} errors`);
                        update_progress_display(100);
                        show_completion_button();
                        cur_list.refresh();
                        return;
                    }
                    
                    setTimeout(function() {
                        process_next_chunk(result.next_start);
                    }, 300);
                }
            },
            error: function() {
                update_progress('Network error occurred', 0, true);
            }
        });
    }
    
    function update_status(message) {
        progress_dialog.$wrapper.find('#status_text').text(message);
    }
    
    function update_progress_display(percent) {
        let progress_bar = progress_dialog.$wrapper.find('#progress_bar');
        progress_bar.css('width', percent + '%').text(percent + '%');
    }
    
    function update_stats(processed, success, errors) {
        function animate_counter(element, new_value) {
            let $element = progress_dialog.$wrapper.find(element);
            let old_value = parseInt($element.text()) || 0;
            
            if (new_value !== old_value) {
                $element.addClass('counter-update');
                $element.parent().addClass('pulse');
                $element.text(new_value);
                
                setTimeout(function() {
                    $element.removeClass('counter-update');
                    $element.parent().removeClass('pulse');
                }, 600);
            }
        }
        
        animate_counter('#processed_count', processed);
        animate_counter('#success_count', success);
        animate_counter('#error_count', errors);
        
        progress_dialog.$wrapper.find('#stats').addClass('pulse');
        setTimeout(function() {
            progress_dialog.$wrapper.find('#stats').removeClass('pulse');
        }, 500);
    }
    
    function update_error_log() {
        if (all_errors.length > 0) {
            let error_html = '<div style="color: red; font-size: 11px;"><strong>Recent Errors:</strong><br>' + 
                           all_errors.slice(-5).join('<br>') + '</div>';
            progress_dialog.$wrapper.find('#error_log').html(error_html);
        }
    }
    
    function update_progress(message, percent, show_stop) {
        update_status(message);
        update_progress_display(percent);
        
        if (show_stop) {
            show_completion_button();
        } else {
            let processing_messages = [
                "Processing employees...",
                "Renaming documents...", 
                "Updating references...",
                "Validating changes..."
            ];
            let random_message = processing_messages[Math.floor(Math.random() * processing_messages.length)];
            progress_dialog.$wrapper.find('#processing_text').html(`<i class="fa fa-circle-o-notch fa-spin" style="margin-right: 5px;"></i>${random_message}`);
        }
    }
    
    function show_completion_button() {
        progress_dialog.$wrapper.find('.fa-spin').removeClass('fa-spin').removeClass('fa-cog').addClass('fa-check');
        progress_dialog.$wrapper.find('.gradient-loader').addClass('loader-completed');
        progress_dialog.$wrapper.find('#processing_text').html('<i class="fa fa-check-circle" style="margin-right: 5px; color: #28a745;"></i>Processing completed!').addClass('processing-completed');
        
        progress_dialog.set_primary_action(__('Close'), function() {
            progress_dialog.hide();
        });
        
        progress_dialog.$wrapper.find('.btn-danger').removeClass('btn-danger').addClass('btn-success');
    }
    
    process_next_chunk(0);
}