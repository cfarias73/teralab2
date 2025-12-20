
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Satellite, Leaf, BarChart3, Zap, MapPin, Microscope, Cloud, ArrowRight, ChevronDown, Play, CheckCircle2, Star, X, Camera, Sparkles, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const [scrollY, setScrollY] = useState(0);
    const [showConversionPopup, setShowConversionPopup] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Show conversion popup after 10 seconds (give time to read hero)
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only show if user hasn't seen it before in this session
            if (!sessionStorage.getItem('conversionPopupShown')) {
                setShowConversionPopup(true);
                sessionStorage.setItem('conversionPopupShown', 'true');
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    const handlePopupCTA = () => {
        // Track popup CTA click in Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'popup_cta_click', {
                event_category: 'Conversion',
                event_label: 'Landing Popup CTA'
            });
        }
        setShowConversionPopup(false);
        navigate('/field-editor');
    };

    const features = language === 'es' ? [
        {
            icon: Satellite,
            title: 'Análisis Satelital',
            description: 'Imágenes de alta resolución con índices NDVI y NDWI para identificar variabilidad del suelo y zonas productivas.',
            color: 'from-emerald-500 to-teal-600'
        },
        {
            icon: Microscope,
            title: 'IA Visual de Suelos',
            description: 'A partir de fotografías del suelo, nuestra IA identifica textura, color (Munsell), compactación y posibles deficiencias.',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            icon: MapPin,
            title: 'Muestreo Inteligente',
            description: 'Generación automática de puntos de muestreo optimizados según la variabilidad real del terreno.',
            color: 'from-amber-500 to-orange-600'
        },
        {
            icon: BarChart3,
            title: 'Reportes Profesionales',
            description: 'Reportes claros con análisis de suelo y programa de fertilización/fertirriego, listos para aplicar en campo (PDF).',
            color: 'from-purple-500 to-pink-600'
        }
    ] : [
        {
            icon: Satellite,
            title: 'Satellite Analysis',
            description: 'High-resolution imagery with NDVI and NDWI indices to identify soil variability and productive zones.',
            color: 'from-emerald-500 to-teal-600'
        },
        {
            icon: Microscope,
            title: 'AI Visual Soil Analysis',
            description: 'From soil photographs, our AI identifies texture, color (Munsell), compaction and possible deficiencies.',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            icon: MapPin,
            title: 'Smart Sampling',
            description: 'Automatic generation of optimized sampling points based on actual terrain variability.',
            color: 'from-amber-500 to-orange-600'
        },
        {
            icon: BarChart3,
            title: 'Professional Reports',
            description: 'Clear reports with soil analysis and fertilization program, ready to apply in the field (PDF).',
            color: 'from-purple-500 to-pink-600'
        }
    ];

    const stats = language === 'es' ? [
        { value: '10,000+', label: 'Hectáreas Analizadas' },
        { value: '500+', label: 'Productores Activos' },
        { value: '95%', label: 'Precisión en Diagnóstico' },
        { value: 'Resultados', label: 'en < 1 minuto' }
    ] : [
        { value: '10,000+', label: 'Hectares Analyzed' },
        { value: '500+', label: 'Active Farmers' },
        { value: '95%', label: 'Diagnostic Accuracy' },
        { value: 'Results', label: 'in < 1 minute' }
    ];

    // Translations object for static text
    const t = language === 'es' ? {
        heroTag: 'La Nueva Era del Diagnóstico de Suelos',
        heroTitle1: 'Analiza tu suelo',
        heroTitle2: 'con Inteligencia Artificial',
        heroSubtitle: 'Fotografía, analiza y recibe diagnóstico profesional de suelos en segundos. Sin laboratorios, sin esperas.',
        heroBenefits: ['Sin equipos costosos', 'Resultados en minutos', 'Diagnóstico con IA avanzada'],
        ctaButton: 'Comenzar Gratis',
        watchDemo: 'Ver Demo',
        featuresTitle: 'Todo lo que necesitas para',
        featuresTitleHighlight: 'optimizar tu producción',
        howItWorks: 'Cómo Funciona',
        step1Title: 'Marca tu Campo',
        step1Desc: 'Dibuja los límites de tu parcela en el mapa interactivo.',
        step2Title: 'Toma Fotos',
        step2Desc: 'Captura fotos del suelo en los puntos de muestreo.',
        step3Title: 'Recibe Análisis',
        step3Desc: 'Obtén diagnóstico completo y recomendaciones.',
        testimonialsTitle: 'Lo que dicen nuestros',
        testimonialsTitleHighlight: 'productores',
        finalCta: '¿Listo para revolucionar tu agricultura?',
        finalCtaSubtitle: 'Únete a miles de productores que ya optimizan sus cultivos con TeraLab.',
        startNow: 'Empezar Ahora',
        footer: 'Transformando la agricultura con inteligencia artificial.',
        popupFree: '¡GRATIS!',
        popupTitle: 'Tu primer análisis de suelo con solo una foto.',
        popupSubtitle: 'Sin laboratorios ni esperas. Recibe el diagnóstico de tu campo en',
        popupSeconds: '30 segundos',
        popupCta: 'ANALIZAR MI CAMPO AHORA',
        popupDismiss: 'No, gracias. Prefiero seguir esperando al laboratorio.'
    } : {
        heroTag: 'The New Era of Soil Diagnostics',
        heroTitle1: 'Analyze your soil',
        heroTitle2: 'with Artificial Intelligence',
        heroSubtitle: 'Photograph, analyze and receive professional soil diagnosis in seconds. No labs, no waiting.',
        heroBenefits: ['No expensive equipment', 'Results in minutes', 'Advanced AI diagnosis'],
        ctaButton: 'Start Free',
        watchDemo: 'Watch Demo',
        featuresTitle: 'Everything you need to',
        featuresTitleHighlight: 'optimize your production',
        howItWorks: 'How It Works',
        step1Title: 'Mark Your Field',
        step1Desc: 'Draw the boundaries of your plot on the interactive map.',
        step2Title: 'Take Photos',
        step2Desc: 'Capture soil photos at sampling points.',
        step3Title: 'Get Analysis',
        step3Desc: 'Get complete diagnosis and recommendations.',
        testimonialsTitle: 'What our',
        testimonialsTitleHighlight: 'farmers say',
        finalCta: 'Ready to revolutionize your agriculture?',
        finalCtaSubtitle: 'Join thousands of farmers already optimizing their crops with TeraLab.',
        startNow: 'Start Now',
        footer: 'Transforming agriculture with artificial intelligence.',
        popupFree: 'FREE!',
        popupTitle: 'Your first soil analysis with just a photo.',
        popupSubtitle: 'No labs or waiting. Get your field diagnosis in',
        popupSeconds: '30 seconds',
        popupCta: 'ANALYZE MY FIELD NOW',
        popupDismiss: "No thanks. I'd rather keep waiting for the lab."
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/10' : ''}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">
                            <span className="text-emerald-400">tera</span>lab
                        </span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                            {language === 'es' ? 'Características' : 'Features'}
                        </a>
                        <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                            {language === 'es' ? 'Cómo Funciona' : 'How It Works'}
                        </a>
                        <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                            {language === 'es' ? 'Testimonios' : 'Testimonials'}
                        </a>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* Language Toggle */}
                        <button
                            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                            className="flex items-center space-x-1.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 px-3 py-2 rounded-full text-sm transition-all"
                        >
                            <Globe className="w-4 h-4 text-emerald-400" />
                            <span className="text-gray-300 font-medium uppercase text-xs">{language}</span>
                        </button>
                        <button
                            onClick={() => navigate('/auth')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-6 py-2.5 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"
                        >
                            {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <img
                        src="/ndvi-hero.png"
                        alt=""
                        className="w-full h-full object-cover opacity-40"
                        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/80 to-gray-950" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
                </div>

                {/* Animated Grid */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                        animation: 'pulse 4s ease-in-out infinite'
                    }} />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
                                <Zap className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 text-sm font-medium">{t.heroTag}</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                                <span className="text-white">{t.heroTitle1}</span>
                                <br />
                                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                                    {t.heroTitle2}
                                </span>
                            </h1>

                            <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-6 leading-relaxed">
                                {t.heroSubtitle}
                            </p>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                                {t.heroBenefits.map((item, i) => (
                                    <div key={i} className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-300 text-sm font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <button
                                    onClick={() => {
                                        // Track hero CTA click in Google Analytics
                                        if (typeof window !== 'undefined' && (window as any).gtag) {
                                            (window as any).gtag('event', 'hero_cta_click', {
                                                event_category: 'Conversion',
                                                event_label: 'Hero Start Free Button'
                                            });
                                        }
                                        navigate('/field-editor');
                                    }}
                                    className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold px-8 py-4 rounded-full text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 flex items-center space-x-2"
                                >
                                    <span>{t.ctaButton}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors group">
                                    <div className="w-12 h-12 rounded-full border-2 border-gray-600 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                                        <Play className="w-5 h-5 ml-1" />
                                    </div>
                                    <span className="font-medium">{t.watchDemo}</span>
                                </button>
                            </div>
                        </div>

                        {/* Right: Phone Mockup */}
                        <div className="relative flex justify-center lg:justify-end">
                            <div className="relative">
                                {/* Glow Effect */}
                                <div className="absolute -inset-10 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl opacity-50" />

                                {/* Phone */}
                                <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                                    <img
                                        src="/real-mockup.jpg"
                                        alt="TeraLab App"
                                        className="w-80 md:w-96 rounded-3xl shadow-2xl shadow-black/50"
                                    />
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute -top-8 -left-8 bg-gray-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-xl animate-float">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <Satellite className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">NDVI Score</p>
                                            <p className="text-lg font-bold text-emerald-400">0.82</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -bottom-4 -right-4 bg-gray-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-xl animate-float-delayed">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <Cloud className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Humedad</p>
                                            <p className="text-lg font-bold text-blue-400">68%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <ChevronDown className="w-8 h-8 text-gray-500" />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-20 border-y border-white/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </p>
                                <p className="text-gray-500 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            {t.featuresTitle} <span className="text-emerald-400">{t.featuresTitleHighlight}</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            {language === 'es'
                                ? 'Herramientas profesionales de agricultura de precisión, ahora accesibles desde tu smartphone.'
                                : 'Professional precision agriculture tools, now accessible from your smartphone.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="group relative bg-gray-900/50 border border-white/10 rounded-3xl p-8 hover:border-emerald-500/50 transition-all duration-500 overflow-hidden"
                            >
                                {/* Hover Glow */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>

                                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-emerald-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="relative py-32 overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <img src="/tech-pattern.png" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-transparent to-gray-950" />
                </div>

                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            {language === 'es' ? '¿Cómo ' : 'How does it '}
                            <span className="text-emerald-400">{language === 'es' ? 'funciona' : 'work'}</span>?
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            {language === 'es'
                                ? 'En solo 3 pasos, obtén un diagnóstico completo de la salud de tu suelo.'
                                : 'In just 3 steps, get a complete diagnosis of your soil health.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {(language === 'es' ? [
                            { step: '01', title: 'Dibuja tu Campo', desc: 'Delimita tu parcela en el mapa o sube un archivo GeoJSON. La IA calculará las zonas de muestreo.' },
                            { step: '02', title: 'Toma Fotos del Suelo', desc: 'Sigue la guía de puntos GPS y fotografía las muestras. Nuestra IA analizará cada imagen.' },
                            { step: '03', title: 'Recibe tu Reporte', desc: 'Obtén un informe ejecutivo con diagnóstico, problemas detectados y plan de fertilización.' }
                        ] : [
                            { step: '01', title: 'Draw Your Field', desc: 'Delimit your plot on the map or upload a GeoJSON file. AI will calculate the sampling zones.' },
                            { step: '02', title: 'Take Soil Photos', desc: 'Follow the GPS point guide and photograph the samples. Our AI will analyze each image.' },
                            { step: '03', title: 'Get Your Report', desc: 'Get an executive report with diagnosis, detected problems and fertilization plan.' }
                        ]).map((item, i) => (
                            <div key={i} className="relative">
                                <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full hover:border-emerald-500/30 transition-colors group">
                                    <span className="text-6xl font-bold text-gray-800 group-hover:text-emerald-900/50 transition-colors">
                                        {item.step}
                                    </span>
                                    <h3 className="text-xl font-bold mt-4 mb-3">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </div>
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="relative py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            {t.testimonialsTitle} <span className="text-emerald-400">{t.testimonialsTitleHighlight}</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {(language === 'es' ? [
                            { name: 'Carlos Mendoza', role: 'Productor de Maíz, Sinaloa', text: 'TeraLab me ayudó a identificar zonas de estrés hídrico que no podía ver a simple vista. Aumenté mi rendimiento un 15%.' },
                            { name: 'María González', role: 'Agrónoma, Jalisco', text: 'La precisión del análisis de suelos con IA es impresionante. Me ahorra horas de trabajo de campo cada semana.' },
                            { name: 'Roberto Jiménez', role: 'Productor de Aguacate, Michoacán', text: 'Los reportes profesionales me permiten tomar decisiones basadas en datos reales, no en suposiciones.' }
                        ] : [
                            { name: 'Carlos Mendoza', role: 'Corn Producer, Sinaloa', text: 'TeraLab helped me identify water stress zones I couldn\'t see with the naked eye. I increased my yield by 15%.' },
                            { name: 'María González', role: 'Agronomist, Jalisco', text: 'The precision of AI soil analysis is impressive. It saves me hours of fieldwork every week.' },
                            { name: 'Roberto Jiménez', role: 'Avocado Producer, Michoacán', text: 'Professional reports allow me to make decisions based on real data, not assumptions.' }
                        ]).map((testimonial, i) => (
                            <div key={i} className="bg-gray-900/50 border border-white/10 rounded-3xl p-8">
                                <div className="flex mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-bold text-white">{testimonial.name}</p>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 rounded-3xl p-12 md:p-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            {language === 'es'
                                ? <>Obtén tu análisis y plan de fertilización <span className="text-emerald-400">hoy</span></>
                                : <>Get your analysis and fertilization plan <span className="text-emerald-400">today</span></>}
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                            {language === 'es'
                                ? 'En menos de 1 minuto, sin laboratorio y sin esperas.'
                                : 'In less than 1 minute, no lab and no waiting.'}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/field-editor')}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold px-8 py-4 rounded-full text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 flex items-center space-x-2"
                            >
                                <span>{language === 'es' ? 'Crear mi Primer Campo' : 'Create My First Field'}</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {language === 'es' ? 'Sin tarjeta de crédito' : 'No credit card'}
                            </span>
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {language === 'es' ? 'Acceso inmediato' : 'Instant access'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold"><span className="text-emerald-400">tera</span>lab.app</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © 2024 TeraLab. {language === 'es' ? 'Agricultura de precisión inteligente.' : 'Smart precision agriculture.'}
                        </p>
                    </div>
                </div>
            </footer>

            {/* Custom Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 4s ease-in-out infinite 0.5s;
                }
            `}</style>

            {/* Conversion Popup */}
            {showConversionPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowConversionPopup(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-[380px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Close button */}
                        <button
                            onClick={() => setShowConversionPopup(false)}
                            className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg"
                        >
                            <X size={16} />
                        </button>

                        <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-emerald-500/10">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 rounded-2xl" />

                            {/* Header with GRATIS badge */}
                            <div className="relative pt-6 pb-4 text-center">
                                <div className="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/30 mb-4">
                                    <Sparkles className="w-5 h-5 text-gray-950 mr-2" />
                                    <span className="text-2xl font-black text-gray-950 tracking-tight">{t.popupFree}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="relative px-6 pb-6 text-center">
                                <h2 className="text-xl font-bold text-white mb-3 leading-tight">
                                    {t.popupTitle}
                                </h2>

                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    {t.popupSubtitle} <span className="text-emerald-400 font-semibold">{t.popupSeconds}</span>.
                                </p>

                                {/* Visual element */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                                            <Camera className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <Zap className="w-3 h-3 text-gray-950" />
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={handlePopupCTA}
                                    className="w-full group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold py-4 px-6 rounded-xl text-base transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] flex items-center justify-center space-x-2"
                                >
                                    <span>{t.popupCta}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>

                                {/* Dismiss link */}
                                <button
                                    onClick={() => setShowConversionPopup(false)}
                                    className="mt-4 text-gray-600 hover:text-gray-400 text-xs transition-colors"
                                >
                                    {t.popupDismiss}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
