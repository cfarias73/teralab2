
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Satellite, Leaf, BarChart3, Zap, MapPin, Microscope, Cloud, ArrowRight, ChevronDown, Play, CheckCircle2, Star } from 'lucide-react';

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
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
    ];

    const stats = [
        { value: '10,000+', label: 'Hectáreas Analizadas' },
        { value: '500+', label: 'Productores Activos' },
        { value: '95%', label: 'Precisión en Diagnóstico' },
        { value: 'Resultados', label: 'en < 1 minuto' }
    ];

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
                        <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Características</a>
                        <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Cómo Funciona</a>
                        <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Testimonios</a>
                    </div>
                    <button
                        onClick={() => navigate('/auth')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-6 py-2.5 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"
                    >
                        Iniciar Sesión
                    </button>
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
                                <span className="text-emerald-400 text-sm font-medium">Tecnología Satelital + IA</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                                <span className="text-white">Análisis de suelo y programa de fertilización</span>
                                <br />
                                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                                    en menos de 1 minuto
                                </span>
                            </h1>

                            <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-6 leading-relaxed">
                                Combina imágenes satelitales, inteligencia artificial y análisis visual del suelo para recomendar cómo y cuánto fertilizar, según tu cultivo y etapa.
                            </p>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                                {['Sin laboratorio', 'Sin esperas', 'Resultados listos para aplicar'].map((item, i) => (
                                    <div key={i} className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-300 text-sm font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <button
                                    onClick={() => navigate('/field-editor')}
                                    className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold px-8 py-4 rounded-full text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 flex items-center space-x-2"
                                >
                                    <span>Comenzar Gratis</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors group">
                                    <div className="w-12 h-12 rounded-full border-2 border-gray-600 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                                        <Play className="w-5 h-5 ml-1" />
                                    </div>
                                    <span className="font-medium">Ver Demo</span>
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
                            Tecnología de <span className="text-emerald-400">vanguardia</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Herramientas profesionales de agricultura de precisión, ahora accesibles desde tu smartphone.
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
                            ¿Cómo <span className="text-emerald-400">funciona</span>?
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            En solo 3 pasos, obtén un diagnóstico completo de la salud de tu suelo.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Dibuja tu Campo', desc: 'Delimita tu parcela en el mapa o sube un archivo GeoJSON. La IA calculará las zonas de muestreo.' },
                            { step: '02', title: 'Toma Fotos del Suelo', desc: 'Sigue la guía de puntos GPS y fotografía las muestras. Nuestra IA analizará cada imagen.' },
                            { step: '03', title: 'Recibe tu Reporte', desc: 'Obtén un informe ejecutivo con diagnóstico, problemas detectados y plan de fertilización.' }
                        ].map((item, i) => (
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
                            Lo que dicen nuestros <span className="text-emerald-400">usuarios</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: 'Carlos Mendoza', role: 'Productor de Maíz, Sinaloa', text: 'TeraLab me ayudó a identificar zonas de estrés hídrico que no podía ver a simple vista. Aumenté mi rendimiento un 15%.' },
                            { name: 'María González', role: 'Agrónoma, Jalisco', text: 'La precisión del análisis de suelos con IA es impresionante. Me ahorra horas de trabajo de campo cada semana.' },
                            { name: 'Roberto Jiménez', role: 'Productor de Aguacate, Michoacán', text: 'Los reportes profesionales me permiten tomar decisiones basadas en datos reales, no en suposiciones.' }
                        ].map((t, i) => (
                            <div key={i} className="bg-gray-900/50 border border-white/10 rounded-3xl p-8">
                                <div className="flex mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-gray-300 mb-6 leading-relaxed">"{t.text}"</p>
                                <div>
                                    <p className="font-bold text-white">{t.name}</p>
                                    <p className="text-sm text-gray-500">{t.role}</p>
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
                            Obtén tu análisis y plan de fertilización <span className="text-emerald-400">hoy</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                            En menos de 1 minuto, sin laboratorio y sin esperas.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/field-editor')}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold px-8 py-4 rounded-full text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 flex items-center space-x-2"
                            >
                                <span>Crear mi Primer Campo</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sin tarjeta de crédito</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Acceso inmediato</span>
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
                            © 2024 TeraLab. Agricultura de precisión inteligente.
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
        </div>
    );
};
