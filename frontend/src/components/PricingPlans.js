import React, { useState } from 'react';
import { Check } from 'lucide-react';

const PricingPlans = () => {
    const [isAnnual, setIsAnnual] = useState(false);

    const plans = [
        {
            name: "Starter",
            description: "Perfect for testing LinkedIn automation",
            price: isAnnual ? 29 : 39,
            features: [
                "100 prospects/month",
                "2 active campaigns",
                "Basic templates",
                "Email support",
                "Basic analytics"
            ],
            highlighted: false
        },
        {
            name: "Professional",
            description: "For growing businesses",
            price: isAnnual ? 49 : 59,
            features: [
                "500 prospects/month",
                "5 active campaigns",
                "Advanced templates",
                "Priority support",
                "Advanced analytics",
                "CRM integration",
                "API access"
            ],
            highlighted: true
        },
        {
            name: "Enterprise",
            description: "For large teams and companies",
            price: isAnnual ? 99 : 119,
            features: [
                "Unlimited prospects",
                "Unlimited campaigns",
                "Custom templates",
                "Dedicated support",
                "Full analytics suite",
                "CRM integration",
                "API access",
                "Custom features"
            ],
            highlighted: false
        }
    ];

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Choose your plan
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Start automating your LinkedIn prospecting today
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-12">
                <div className="relative flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <button
                        onClick={() => setIsAnnual(false)}
                        className={`px-4 py-2 text-sm rounded-full transition-all ${
                            !isAnnual
                                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setIsAnnual(true)}
                        className={`px-4 py-2 text-sm rounded-full transition-all ${
                            isAnnual
                                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        Annually <span className="text-green-500">-20%</span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative rounded-2xl overflow-hidden ${
                            plan.highlighted
                                ? 'border-2 border-blue-500 dark:border-blue-400 scale-105 shadow-xl'
                                : 'border border-gray-200 dark:border-gray-700'
                        } bg-white dark:bg-gray-800 transition-all duration-200`}
                    >
                        {plan.highlighted && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm">
                                Popular
                            </div>
                        )}

                        <div className="p-8">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {plan.name}
                            </h3>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 h-12">
                                {plan.description}
                            </p>
                            <p className="mt-8 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  €{plan.price}
                </span>
                                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  /{isAnnual ? 'year' : 'month'}
                </span>
                            </p>

                            <ul className="mt-8 space-y-4">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                        <span className="ml-3 text-gray-600 dark:text-gray-300">
                      {feature}
                    </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`mt-8 w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                    plan.highlighted
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                }`}
                            >
                                {plan.highlighted ? 'Start free trial' : 'Get started'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-12 text-center text-gray-500 dark:text-gray-400">
                All prices exclude VAT. Cancel anytime.
            </p>
        </div>
    );
};

export default PricingPlans;