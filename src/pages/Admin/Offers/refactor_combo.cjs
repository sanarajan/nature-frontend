const fs = require('fs');

const comboListPath = 'd:\\sana\\naturalayam\\nature-frontend\\src\\pages\\Admin\\Offers\\ComboOffers.tsx';
const comboFormPath = 'd:\\sana\\naturalayam\\nature-frontend\\src\\pages\\Admin\\Offers\\ComboOfferForm.tsx';

let contentList = fs.readFileSync(comboListPath, 'utf-8');

// For ComboOffers.tsx (List View):
const modalStart = contentList.indexOf('{showModal && (');
if (modalStart !== -1) {
    let newContentList = contentList.substring(0, modalStart) + '        </div>\n    );\n};\n\nexport default ComboOffers;\n';
    newContentList = newContentList.replace(
        "import React, { useState, useEffect } from 'react';", 
        "import React, { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';"
    );
    newContentList = newContentList.replace(
        /const openModal = \(\) => \{[^]*?\};/, 
        'const navigate = useNavigate();\n    const openModal = () => { navigate("/admin/offers/combo/create"); };'
    );
    newContentList = newContentList.replace(
        /const openEditModal = \(offer: any\) => \{[^]*?\};/, 
        'const openEditModal = (offer: any) => { navigate(`/admin/offers/combo/edit/${offer._id}`); };'
    );
    fs.writeFileSync(comboListPath, newContentList, 'utf-8');
    console.log('Updated ComboOffers.tsx');
}

// For ComboOfferForm.tsx (Form View):
let contentForm = fs.readFileSync(comboFormPath, 'utf-8');
contentForm = contentForm.replace("const ComboOffers: React.FC = () => {", "const ComboOfferForm: React.FC = () => {");
contentForm = contentForm.replace("export default ComboOffers;", "export default ComboOfferForm;");
contentForm = contentForm.replace(
    "import React, { useState, useEffect } from 'react';", 
    "import React, { useState, useEffect } from 'react';\nimport { useParams, useNavigate } from 'react-router-dom';"
);

const returnStart = contentForm.indexOf('return (\n        <div className="admin-page-container">');
const formStart = contentForm.indexOf('<form onSubmit={handleSubmit}>');

const headerHtml = `return (
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
`;

const formEnd = contentForm.lastIndexOf('</form>');
let formContent = contentForm.substring(formStart, formEnd + 7);

formContent = formContent.replace(
    '<div className="form-actions mt-4 d-flex justify-content-end gap-3 sticky-bottom bg-white p-3 border-top shadow-sm" style={{ zIndex: 10 }}>',
    '<div className="form-actions mt-4 d-flex justify-content-end gap-3 sticky-bottom bg-white p-3 border-top shadow-sm rounded-bottom" style={{ zIndex: 10, margin: "-20px" }}>'
);
formContent = formContent.replace(
    '<button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>',
    '<button type="button" className="btn btn-light" onClick={() => navigate(\'/admin/offers/combo\')}>'
);
formContent = formContent.replace(
    "margin: '-20px'", "margin: '0 -20px -20px'"
);

let fullNewRender = headerHtml + formContent + '\n            </div>\n';

const cropperStart = contentForm.indexOf('{isCropModalOpen && (', formEnd);
const cropperEndStr = '</div>\n            )}';
const cropperEnd = contentForm.indexOf(cropperEndStr, cropperStart) + cropperEndStr.length;

fullNewRender += contentForm.substring(cropperStart, cropperEnd) + '\n        </div>\n    );\n};\n\nexport default ComboOfferForm;\n';

let contentTop = contentForm.substring(0, returnStart);

const hookInjection = `
    const { id } = useParams();
    const navigate = useNavigate();
`;
contentTop = contentTop.replace('const [offers, setOffers] = useState<any[]>([]);', hookInjection + '    const [offers, setOffers] = useState<any[]>([]);');

contentTop = contentTop.replace("setShowModal(false);\n                    fetchInitialData();", "navigate('/admin/offers/combo');");
contentTop = contentTop.replace("setShowModal(false);\n                    fetchInitialData();", "navigate('/admin/offers/combo');");

contentTop = contentTop.replace(/const openModal = \(\) => \{[^]*?\};/g, '');
contentTop = contentTop.replace(/const openEditModal = \(offer: any\) => \{[^]*?\};/g, '');

const fetchLogic = `
    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);
                await fetchProducts('');
                if (id) {
                    const res = await adminApiClient.get(\`/admin/combo-listing/\${id}\`);
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
`;

contentTop = contentTop.replace(/useEffect\(\(\) => \{\n        fetchInitialData\(\);[^]*?\n    \}, \[\]\);/, fetchLogic);

fs.writeFileSync(comboFormPath, contentTop + fullNewRender, 'utf-8');
console.log('Updated ComboOfferForm.tsx');
