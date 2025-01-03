// src/config/campaignModulesConfig.js

// Importation des icônes nécessaires
import {
    MessageCircle, UserPlus, Clock, ThumbsUp, Mail,
    Activity, CheckCircle, MessageSquare, Download,
    GitBranch, Share2, Bell, Target, Filter,
    FileText, Database, Send, User, Users,
    Calendar, Tag, Link, Globe, Search,
    BarChart2, PieChart, Settings, AlertCircle,
    Coffee, Play, Pause, Repeat, RotateCcw,
    Briefcase, Building, Star, Heart
} from 'lucide-react';

// Configuration détaillée de chaque module
export const MODULES_CONFIG = {
    // Modules de base
    START: {
        type: 'start',
        label: 'Début',
        icon: GitBranch,
        description: 'Point de départ de la campagne',
        category: 'base',
        configurable: false,
        defaultConfig: {},
        style: {
            background: '#10B981',
            color: 'white'
        },
        validConnections: ['all'],
        maxConnections: 1
    },

    END: {
        type: 'end',
        label: 'Fin',
        icon: Target,
        description: 'Point de fin de la campagne',
        category: 'base',
        configurable: false,
        defaultConfig: {},
        style: {
            background: '#EF4444',
            color: 'white'
        },
        validConnections: [],
        maxConnections: 0
    },

    // Modules d'interaction
    INVITATION: {
        type: 'invitation',
        label: 'Invitation',
        icon: UserPlus,
        description: 'Envoyer une invitation de connexion',
        category: 'interaction',
        configurable: true,
        defaultConfig: {
            message: {
                type: 'textarea',
                label: 'Message d\'invitation',
                placeholder: 'Votre message d\'invitation...',
                maxLength: 300,
                required: true
            },
            template: {
                type: 'select',
                label: 'Template',
                options: ['default', 'professional', 'casual'],
                required: false
            },
            usePersonalization: {
                type: 'checkbox',
                label: 'Utiliser la personnalisation',
                default: true
            },
            variables: {
                type: 'multiSelect',
                label: 'Variables disponibles',
                options: [
                    '{firstName}',
                    '{lastName}',
                    '{company}',
                    '{position}'
                ]
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        },
        validConnections: ['message', 'delay', 'condition'],
        maxConnections: 2
    },

    MESSAGE: {
        type: 'message',
        label: 'Message',
        icon: MessageCircle,
        description: 'Envoyer un message direct',
        category: 'interaction',
        configurable: true,
        defaultConfig: {
            message: {
                type: 'richText',
                label: 'Contenu du message',
                placeholder: 'Votre message...',
                maxLength: 1000,
                required: true
            },
            template: {
                type: 'select',
                label: 'Template',
                options: ['default', 'follow-up', 'reminder']
            },
            attachments: {
                type: 'fileUpload',
                label: 'Pièces jointes',
                accept: '.pdf,.jpg,.png',
                maxSize: 5, // MB
                maxFiles: 3
            },
            scheduling: {
                type: 'schedule',
                label: 'Planification',
                options: {
                    immediate: 'Immédiat',
                    scheduled: 'Planifié'
                }
            },
            reminder: {
                type: 'checkbox',
                label: 'Activer le rappel',
                default: false,
                config: {
                    delay: {
                        type: 'number',
                        label: 'Délai (jours)',
                        min: 1,
                        max: 30
                    }
                }
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        },
        validConnections: ['all'],
        maxConnections: 3
    },

    // Modules d'engagement
    LIKE: {
        type: 'like',
        label: 'Like',
        icon: ThumbsUp,
        description: 'Liker des publications',
        category: 'engagement',
        configurable: true,
        defaultConfig: {
            count: {
                type: 'number',
                label: 'Nombre de likes',
                min: 1,
                max: 5,
                default: 3
            },
            recentOnly: {
                type: 'checkbox',
                label: 'Publications récentes uniquement',
                default: true
            },
            types: {
                type: 'multiSelect',
                label: 'Types de contenu',
                options: [
                    'posts',
                    'articles',
                    'images',
                    'videos'
                ],
                default: ['posts']
            },
            timeframe: {
                type: 'select',
                label: 'Période',
                options: [
                    {value: '7', label: '7 jours'},
                    {value: '30', label: '30 jours'},
                    {value: '90', label: '90 jours'}
                ]
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        },
        validConnections: ['delay', 'condition'],
        maxConnections: 2
    },

    COMMENT: {
        type: 'comment',
        label: 'Commenter',
        icon: MessageSquare,
        description: 'Commenter une publication',
        category: 'engagement',
        configurable: true,
        defaultConfig: {
            message: {
                type: 'textarea',
                label: 'Commentaire',
                placeholder: 'Votre commentaire...',
                maxLength: 500,
                required: true
            },
            templates: {
                type: 'select',
                label: 'Templates de commentaire',
                options: [
                    'appreciation',
                    'question',
                    'insight'
                ]
            },
            contentType: {
                type: 'multiSelect',
                label: 'Type de contenu à commenter',
                options: [
                    'latest_post',
                    'trending_post',
                    'specific_topic'
                ]
            },
            keywords: {
                type: 'tags',
                label: 'Mots-clés',
                placeholder: 'Ajouter des mots-clés'
            },
            sentiment: {
                type: 'select',
                label: 'Ton du commentaire',
                options: [
                    'positif',
                    'neutre',
                    'professionnel'
                ]
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        }
    },

    // Modules de temporisation
    DELAY: {
        type: 'delay',
        label: 'Délai',
        icon: Clock,
        description: 'Ajouter un délai d\'attente',
        category: 'timing',
        configurable: true,
        defaultConfig: {
            duration: {
                type: 'number',
                label: 'Durée',
                min: 1,
                required: true,
                default: 24
            },
            unit: {
                type: 'select',
                label: 'Unité',
                options: [
                    {value: 'minutes', label: 'Minutes'},
                    {value: 'hours', label: 'Heures'},
                    {value: 'days', label: 'Jours'}
                ],
                default: 'hours'
            },
            workingHoursOnly: {
                type: 'checkbox',
                label: 'Pendant les heures de travail uniquement',
                default: true
            },
            randomization: {
                type: 'range',
                label: 'Variation aléatoire',
                min: 0,
                max: 100,
                default: 20,
                unit: '%'
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        }
    },

    WORKING_HOURS: {
        type: 'workingHours',
        label: 'Heures de travail',
        icon: Coffee,
        description: 'Définir les heures d\'exécution',
        category: 'timing',
        configurable: true,
        defaultConfig: {
            schedule: {
                type: 'timeRange',
                label: 'Horaires',
                start: {
                    type: 'time',
                    label: 'Début',
                    default: '09:00'
                },
                end: {
                    type: 'time',
                    label: 'Fin',
                    default: '17:00'
                }
            },
            workDays: {
                type: 'multiSelect',
                label: 'Jours de travail',
                options: [
                    {value: 'Mon', label: 'Lundi'},
                    {value: 'Tue', label: 'Mardi'},
                    {value: 'Wed', label: 'Mercredi'},
                    {value: 'Thu', label: 'Jeudi'},
                    {value: 'Fri', label: 'Vendredi'},
                    {value: 'Sat', label: 'Samedi'},
                    {value: 'Sun', label: 'Dimanche'}
                ],
                default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
            },
            timezone: {
                type: 'select',
                label: 'Fuseau horaire',
                options: [
                    'Europe/Paris',
                    'UTC',
                    'America/New_York'
                ],
                default: 'Europe/Paris'
            },
            exceptions: {
                type: 'datePicker',
                label: 'Jours d\'exception',
                multiple: true
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        }
    },

    // Modules de condition
    IF_CONNECTED: {
        type: 'ifConnected',
        label: 'Si connecté',
        icon: Link,
        description: 'Vérifier si le prospect est connecté',
        category: 'condition',
        configurable: true,
        defaultConfig: {
            checkFrequency: {
                type: 'select',
                label: 'Fréquence de vérification',
                options: [
                    {value: 'immediate', label: 'Immédiate'},
                    {value: 'daily', label: 'Quotidienne'},
                    {value: 'weekly', label: 'Hebdomadaire'}
                ]
            },
            waitDuration: {
                type: 'number',
                label: 'Durée d\'attente maximale',
                unit: 'jours',
                default: 7
            },
            actions: {
                type: 'multiSelect',
                label: 'Actions si non connecté',
                options: [
                    'relancer',
                    'notifier',
                    'abandonner'
                ]
            }
        }
    },

    IF_RESPONDED: {
        type: 'ifResponded',
        label: 'Si répondu',
        icon: MessageCircle,
        description: 'Vérifier si le prospect a répondu',
        category: 'condition',
        configurable: true,
        defaultConfig: {
            responseType: {
                type: 'select',
                label: 'Type de réponse attendue',
                options: [
                    {value: 'any', label: 'Toute réponse'},
                    {value: 'positive', label: 'Réponse positive'},
                    {value: 'negative', label: 'Réponse négative'},
                ]
            },
            timeframe: {
                type: 'number',
                label: 'Délai d\'attente',
                unit: 'jours',
                default: 7
            },
            keywords: {
                type: 'tags',
                label: 'Mots-clés',
                placeholder: 'Mots-clés à détecter'
            },
            sentiment: {
                type: 'select',
                label: 'Analyse du sentiment',
                options: [
                    'positif',
                    'neutre',
                    'négatif'
                ]
            }
        }
    },

    // Modules de données
    EXTRACT_INFO: {
        type: 'extractInfo',
        label: 'Extraire infos',
        icon: Database,
        description: 'Extraire des informations du profil',
        category: 'data',
        configurable: true,
        defaultConfig: {
            fields: {
                type: 'multiSelect',
                label: 'Champs à extraire',
                options: [
                    'position',
                    'company',
                    'location',
                    'experience',
                    'education',
                    'skills',
                    'certifications',
                    'languages'
                ]
            },
            format: {
                type: 'select',
                label: 'Format d\'export',
                options: [
                    'JSON',
                    'CSV',
                    'XML'
                ]
            },
            enrichment: {
                type: 'checkbox',
                label: 'Enrichissement de données',
                options: [
                    'company_info',
                    'social_profiles',
                    'contact_details'
                ]
            }
        }
    },

    // Modules de qualification
    SCORE_LEAD: {
        type: 'scoreLead',
        label: 'Score prospect',
        icon: Star,
        description: 'Calculer le score du prospect',
        category: 'qualification',
        configurable: true,
        defaultConfig: {
            criteria: {
                type: 'scoreCard',
                label: 'Critères de scoring',
                fields: {
                    position: {
                        weight: 10,
                        type: 'select',
                        options: [
                            'C-level',
                            'Manager',
                            'Employee'
                        ]
                    },
                    companySize: {
                        weight: 20,
                        type: 'range',
                        min: 0,
                        max: 10000
                    },
                    industry: {
                        weight: 15,
                        type: 'multiSelect',
                        options: [
                            'Technology',
                            'Finance',
                            'Healthcare',
                            'Manufacturing',
                            'Retail'
                        ]
                    },
                    engagement: {
                        weight: 15,
                        type: 'calculate',
                        factors: [
                            'profile_views',
                            'message_responses',
                            'content_interactions'
                        ]
                    }
                }
            },
            thresholds: {
                type: 'rangeSliders',
                label: 'Seuils de qualification',
                fields: {
                    hot: {min: 80, label: 'Prospect chaud'},
                    warm: {min: 50, label: 'Prospect tiède'},
                    cold: {min: 0, label: 'Prospect froid'}
                }
            },
            autoTags: {
                type: 'checkbox',
                label: 'Tags automatiques',
                default: true
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        }
    },

    // Module d'intégration CRM
    CRM_SYNC: {
        type: 'crmSync',
        label: 'Synchro CRM',
        icon: Repeat,
        description: 'Synchroniser avec le CRM',
        category: 'integration',
        configurable: true,
        defaultConfig: {
            platform: {
                type: 'select',
                label: 'Plateforme CRM',
                options: [
                    'Salesforce',
                    'HubSpot',
                    'Pipedrive',
                    'Microsoft Dynamics'
                ],
                required: true
            },
            mapping: {
                type: 'fieldMapping',
                label: 'Mapping des champs',
                fields: {
                    firstName: {
                        type: 'text',
                        crm_field: 'FirstName',
                        required: true
                    },
                    lastName: {
                        type: 'text',
                        crm_field: 'LastName',
                        required: true
                    },
                    email: {
                        type: 'email',
                        crm_field: 'Email',
                        required: false
                    },
                    company: {
                        type: 'text',
                        crm_field: 'Company',
                        required: false
                    }
                }
            },
            syncOptions: {
                type: 'checkboxGroup',
                label: 'Options de synchronisation',
                options: {
                    autoCreate: {
                        label: 'Création automatique',
                        default: true
                    },
                    updateExisting: {
                        label: 'Mise à jour existants',
                        default: true
                    },
                    syncActivities: {
                        label: 'Synchroniser activités',
                        default: false
                    }
                }
            },
            syncFrequency: {
                type: 'select',
                label: 'Fréquence de synchronisation',
                options: [
                    {value: 'realtime', label: 'Temps réel'},
                    {value: 'hourly', label: 'Toutes les heures'},
                    {value: 'daily', label: 'Quotidienne'}
                ]
            }
        }
    },

    // Module d'analyse IA
    AI_ANALYSIS: {
        type: 'aiAnalysis',
        label: 'Analyse IA',
        icon: Activity,
        description: 'Analyser avec l\'IA',
        category: 'advanced',
        configurable: true,
        defaultConfig: {
            analysisType: {
                type: 'multiSelect',
                label: 'Types d\'analyse',
                options: [
                    'sentiment',
                    'intention',
                    'personnalité',
                    'intérêt'
                ]
            },
            model: {
                type: 'select',
                label: 'Modèle d\'IA',
                options: [
                    {value: 'gpt4', label: 'GPT-4'},
                    {value: 'claude', label: 'Claude'},
                    {value: 'custom', label: 'Personnalisé'}
                ]
            },
            dataPoints: {
                type: 'checkboxGroup',
                label: 'Points de données',
                options: {
                    messages: {
                        label: 'Messages échangés',
                        default: true
                    },
                    profile: {
                        label: 'Profil LinkedIn',
                        default: true
                    },
                    activities: {
                        label: 'Activités récentes',
                        default: false
                    }
                }
            },
            outputFormat: {
                type: 'select',
                label: 'Format de sortie',
                options: [
                    'JSON',
                    'Texte',
                    'Rapport PDF'
                ]
            },
            triggers: {
                type: 'multiSelect',
                label: 'Déclencheurs d\'analyse',
                options: [
                    'Nouveau message',
                    'Changement de statut',
                    'Score modifié'
                ]
            }
        },
        style: {
            background: '#F3F4F6',
            color: '#000'
        }
    },

    // Module de rapport analytique
    ANALYTICS: {
        type: 'analytics',
        label: 'Analytics',
        icon: BarChart2,
        description: 'Suivi des métriques',
        category: 'analytics',
        configurable: true,
        defaultConfig: {
            metrics: {
                type: 'multiSelect',
                label: 'Métriques à suivre',
                options: [
                    'taux_acceptation',
                    'taux_reponse',
                    'taux_conversion',
                    'temps_reponse',
                    'score_engagement'
                ]
            },
            visualization: {
                type: 'select',
                label: 'Type de visualisation',
                options: [
                    'graphique_ligne',
                    'graphique_barre',
                    'camembert',
                    'tableau'
                ]
            },
            period: {
                type: 'select',
                label: 'Période d\'analyse',
                options: [
                    {value: '7d', label: '7 derniers jours'},
                    {value: '30d', label: '30 derniers jours'},
                    {value: '90d', label: '90 derniers jours'}
                ]
            },
            notifications: {
                type: 'threshold',
                label: 'Alertes',
                metrics: {
                    taux_reponse: {
                        min: 10,
                        max: 100,
                        alert: 'below_min'
                    },
                    taux_conversion: {
                        min: 5,
                        max: 100,
                        alert: 'below_min'
                    }
                }
            },
            export: {
                type: 'select',
                label: 'Format d\'export',
                options: [
                    'PDF',
                    'Excel',
                    'CSV'
                ]
            }
        }
    }
};

export default MODULES_CONFIG;