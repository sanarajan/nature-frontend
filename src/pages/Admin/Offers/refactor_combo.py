import re
import os

combo_list_path = r"d:\sana\naturalayam\nature-frontend\src\pages\Admin\Offers\ComboOffers.tsx"
combo_form_path = r"d:\sana\naturalayam\nature-frontend\src\pages\Admin\Offers\ComboOfferForm.tsx"

with open(combo_list_path, "r", encoding="utf-8") as f:
    content = f.read()

# For ComboOffers.tsx (List View):
# We need to remove the modal completely.
# Find the start of the modal: `{showModal && (`
modal_start = content.find("{showModal && (")
if modal_start != -1:
    # Find the end of the modal (which is just before `</div>` that closes admin-page-container)
    # Actually, the modal is the last child of admin-page-container.
    # So we can just truncate before it, and add the closing `</div>\n    );\n};\n\nexport default ComboOffers;`
    content_list = content[:modal_start] + "        </div>\n    );\n};\n\nexport default ComboOffers;\n"
    
    # We also need to change `import` to use `Link` or `useNavigate`
    content_list = content_list.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';")
    
    # We should also replace the `const openModal = () => { ... }` with a navigate
    content_list = re.sub(r'const openModal = \(\) => \{.*?\};', 'const navigate = useNavigate();\n    const openModal = () => { navigate("/admin/offers/combo/create"); };', content_list, flags=re.DOTALL)
    
    # And replace `openEditModal` with navigate
    content_list = re.sub(r'const openEditModal = \(offer: any\) => \{.*?\};', 'const openEditModal = (offer: any) => { navigate(`/admin/offers/combo/edit/${offer._id}`); };', content_list, flags=re.DOTALL)
    
    with open(combo_list_path, "w", encoding="utf-8") as f:
        f.write(content_list)
    print("Updated ComboOffers.tsx")

# For ComboOfferForm.tsx (Form View):
with open(combo_form_path, "r", encoding="utf-8") as f:
    content = f.read()

# Rename component
content = content.replace("const ComboOffers: React.FC = () => {", "const ComboOfferForm: React.FC = () => {")
content = content.replace("export default ComboOffers;", "export default ComboOfferForm;")
content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useParams, useNavigate } from 'react-router-dom';")

# Replace header list UI with Form header UI and form content
# The return statement starts with:
# return (
#     <div className="admin-page-container">
return_start = content.find("return (\n        <div className=\"admin-page-container\">")
form_start = content.find("<form onSubmit={handleSubmit}>")

# We want everything before return_start, then the form
# But we need to keep the outer div, the header, and then the form without the modal wrapper.
header_html = """return (
        <div className="admin-page-container pb-5">
            <div className="admin-page-header mb-4 d-flex align-items-center gap-3">
                <button className="btn btn-light rounded-circle shadow-sm" onClick={() => navigate('/admin/offers/combo')} style={{ width: '40px', height: '40px' }}>
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <h2 className="admin-page-title mb-0">{id ? 'Edit Combo Offer' : 'Create Combo Offer'}</h2>
                    <p className="text-muted small mb-0 mt-1">Configure products, offer rules and customer-facing Combo content.</p>
                </div>
            </div>
            
            <div className="admin-card">
"""

form_end = content.rfind("</form>")
form_content = content[form_start:form_end+7]

form_content_modified = form_content.replace(
    '<div className="form-actions mt-4 d-flex justify-content-end gap-3 sticky-bottom bg-white p-3 border-top shadow-sm" style={{ zIndex: 10 }}>',
    '<div className="form-actions mt-4 d-flex justify-content-end gap-3 sticky-bottom bg-white p-3 border-top shadow-sm rounded-bottom" style={{ zIndex: 10, margin: "-20px" }}>'
)
form_content_modified = form_content_modified.replace(
    '<button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>',
    '<button type="button" className="btn btn-light" onClick={() => navigate(\'/admin/offers/combo\')}>'
)
# change the form footer padding
form_content_modified = form_content_modified.replace(
    "margin: '-20px'", "margin: '0 -20px -20px'"
)

full_new_render = header_html + form_content_modified + "\n            </div>\n"

# also handle cropper modal which is right after form_end
cropper_start = content.find("{isCropModalOpen && (", form_end)
cropper_end = content.find("</div>\n            )}", cropper_start) + 21

full_new_render += content[cropper_start:cropper_end] + "\n        </div>\n    );\n};\n\nexport default ComboOfferForm;\n"

content_top = content[:return_start]

# Add useParams and useNavigate hooks at the beginning of the component
hook_injection = """
    const { id } = useParams();
    const navigate = useNavigate();
"""
content_top = content_top.replace("const [offers, setOffers] = useState<any[]>([]);", hook_injection + "    const [offers, setOffers] = useState<any[]>([]);")

# Change fetchInitialData to fetch a single offer if id is present
# And we also need to change handleSubmit success to navigate back
content_top = content_top.replace("setShowModal(false);\n                    fetchInitialData();", "navigate('/admin/offers/combo');")

# Remove openModal and openEditModal as they are not needed in form
content_top = re.sub(r'const openModal = \(\) => \{.*?\};', '', content_top, flags=re.DOTALL)
content_top = re.sub(r'const openEditModal = \(offer: any\) => \{.*?\};', '', content_top, flags=re.DOTALL)

# Handle fetch logic for editing
fetch_logic = """
    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);
                await fetchProducts('');
                if (id) {
                    const res = await adminApiClient.get(`/admin/combo-listing/${id}`);
                    if (res.data.success) {
                        const offer = res.data.data;
                        setEditingOffer(offer);
                        setFormData({
                            offerName: offer.offerName,
                            products: offer.products.map((p: any) => ({
                                productId: p.productId?._id || p._id || p.productId || p.product?._id || p.product,
                                requiredQuantity: p.requiredQuantity || p.quantity || 1,
                                comboRole: p.comboRole || '',
                                comboRoleDescription: p.comboRoleDescription || ''
                            })),
                            discountType: offer.discountType || 'amount',
                            discountValue: offer.discountValue,
                            maxUsagePerOrder: offer.maxUsagePerOrder || 0,
                            startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
                            endDate: offer.endDate ? offer.endDate.split('T')[0] : '',
                            status: offer.status,
                            image: offer.imageUrl || '',
                            subtitle: offer.subtitle || '',
                            tagline: offer.tagline || '',
                            shortDescription: offer.shortDescription || '',
                            overviewTitle: offer.overviewTitle || '',
                            overviewDescription: offer.overviewDescription || '',
                            routineLabel: offer.routineLabel || '',
                            targetConcerns: offer.targetConcerns || [],
                            whySpecial: offer.whySpecial || [],
                            howToUseSteps: offer.howToUseSteps || [],
                            recommendedRoutine: offer.recommendedRoutine || '',
                            whoMayBenefit: offer.whoMayBenefit || [],
                            resultsAndExpectations: offer.resultsAndExpectations || [],
                            safetyInformation: offer.safetyInformation || [],
                            patchTestGuidance: offer.patchTestGuidance || '',
                            storageInstructions: offer.storageInstructions || '',
                            disclaimer: offer.disclaimer || '',
                            faqs: offer.faqs || [],
                            seoTitle: offer.seoTitle || '',
                            metaDescription: offer.metaDescription || '',
                            slug: offer.slug || '',
                            imageAltText: offer.imageAltText || '',
                            productBadge: offer.productBadge || '',
                            promotionalBadge: offer.promotionalBadge || '',
                            ctaLabel: offer.ctaLabel || '',
                            supportingCtaLabel: offer.supportingCtaLabel || ''
                        });
                        setImagePreview(offer.imageUrl || null);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id]);
"""

# Replace existing useEffect
content_top = re.sub(r'useEffect\(\(\) => \{\n        fetchInitialData\(\);.*?\n    \}, \[\]\);', fetch_logic, content_top, flags=re.DOTALL)

with open(combo_form_path, "w", encoding="utf-8") as f:
    f.write(content_top + full_new_render)
print("Updated ComboOfferForm.tsx")
