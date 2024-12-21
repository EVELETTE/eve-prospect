import React from 'react';
import PricingPlans from './PricingPlans';


const Products = () => {
    return (
        <div className="w-full p-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Nos offres d'abonnement
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Choisissez le plan qui correspond à vos besoins
                    </p>
                </div>
                <PricingPlans />
            </div>
        </div>
    );
};

export default Products;