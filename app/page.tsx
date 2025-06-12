// app/page.tsx - Homepage ใหม่ (โครงสร้างเดิม)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bus,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  Shield,
  CreditCard,
  Search,
  Ticket,
  Heart,
  Award,
  ThumbsUp,
  TrendingUp,
  Globe,
  Zap
} from 'lucide-react';

export default function Homepage() {
  const router = useRouter();
  const [travelDate, setTravelDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [stats, setStats] = useState({
    customers: 0,
    trips: 0,
    satisfaction: 0,
    years: 0
  });

  useEffect(() => {
    // Animation สำหรับตัวเลขสถิติ
    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const increment = duration / steps;
      
      const targets = { customers: 15000, trips: 8500, satisfaction: 98, years: 5 };
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setStats({
          customers: Math.floor(targets.customers * progress),
          trips: Math.floor(targets.trips * progress),
          satisfaction: Math.floor(targets.satisfaction * progress),
          years: Math.floor(targets.years * progress)
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setStats(targets);
        }
      }, increment);
    const testimonials = [

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-blue-600" />,
      title: "ຈອງລ່ວງໜ້າ 24 ຊົ່ວໂມງ",
      description: "ຈອງປີ້ອອນລາຍໄດ້ທຸກເວລາ ຜ່ານເວັບໄຊ ຫຼື ແອັບ",
      highlight: "ສະດວກ"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "ປອດໄພ 100%",
      description: "ລົດທຸກຄັນຜ່ານການກວດສອບ ແລະ ປະກັນໄພຄົບຄົນ",
      highlight: "ເຊື່ອຖື"
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: "ຕົງເວລາທຸກມື້",
      description: "ອອກເດີນທາງຕົງ 08:00 ໂມງເຊົ້າ ບໍ່ມີການປ່ຽນແປງ",
      highlight: "ແນ່ນອນ"
    },
    {
      icon: <CreditCard className="h-8 w-8 text-purple-600" />,
      title: "ລາຄາໂປ່ງໃສ",
      description: "45,000 ກີບ/ຄົນ ບໍ່ມີຄ່າບໍລິການເພີ່ມ",
      highlight: "ຍຸດຕິທຳ"
    }
  ];

  const services = [
    {
      icon: <Ticket className="h-6 w-6 text-blue-600" />,
      title: "ຈອງປີ້ອອນລາຍ",
      description: "ງ່າຍ ໄວ ແລະ ປອດໄພ"
    },
    {
      icon: <Phone className="h-6 w-6 text-green-600" />,
      title: "ສາຍດ່ວນ 24/7",
      description: "ບໍລິການຕອບສະໜອງທຸກເວລາ"
    },
    {
      icon: <MapPin className="h-6 w-6 text-orange-600" />,
      title: "ຈຸດຂຶ້ນ-ລົງສະດວກ",
      description: "ໃກ້ສະຖານີລົດໄຟ"
    },
    {
      icon: <Heart className="h-6 w-6 text-red-600" />,
      title: "ບໍລິການໃສ່ໃຈ",
      description: "ດຸແລລູກຄ້າຢ່າງອົບອຸ່ນ"
    }
  ];

  // ฟังก์ชันสำหรับไปหน้าจองพร้อมข้อมูล
  const handleBookingRedirect = () => {
    if (!travelDate) {
      alert('ກະລຸນາເລືອກວັນທີເດີນທາງ');
      return;
    }
    
    const params = new URLSearchParams({
      date: travelDate,
      passengers: passengers
    });
    
    router.push(`/booking?${params.toString()}`);
  };
    {
      name: "ນາງ ສົມຈັນ ວົງສີ",
      role: "ພະນັກງານບໍລິສັດ",
      content: "ໃຊ້ບໍລິການມາ 2 ປີແລ້ວ ພໍໃຈຫຼາຍ ຄົນຂັບເປັນມິດ ລົດສະອາດ ແລະ ຕົງເວລາທຸກມື້",
      rating: 5,
      avatar: "👩"
    },
    {
      name: "ທ້າວ ວີລະສັກ ບຸນມີ",
      role: "ນັກທ່ອງທ່ຽວ",
      content: "ມາຈາກຕ່າງປະເທດ ຈອງຜ່ານເວັບງ່າຍຫຼາຍ ມີຄົນຊ່ວຍອະທິບາຍເປັນພາສາອັງກິດ",
      rating: 5,
      avatar: "👨"
    },
    {
      name: "ນາງ ມາລີ ຜົງວິຫານ",
      role: "ນັກສຶກສາ",
      content: "ລາຄາຖືກ ເໝາະກັບນັກສຶກສາ ບໍລິການດີ ແນະນຳໃຫ້ເພື່ອນໆ ທຸກຄົນເລີຍ",
      rating: 5,
      avatar: "👩‍🎓"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">ລົດຕູ້ລາວ-ຈີນ</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition-colors">ໜ້າຫຼັກ</a>
              <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">ບໍລິການ</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">ກ່ຽວກັບເຮົາ</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">ຕິດຕໍ່</a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/booking/status')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ກວດສອບສະຖານະ
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ເຂົ້າສູ່ລະບົບ
              </button>
              <button
                onClick={() => router.push('/booking')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ຈອງປີ້
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Booking Section */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ເດີນທາງສະດວກ ປອດໄພ
            </h1>
            <p className="text-xl text-blue-100 mb-2">ບໍລິການລົດຕູ້ໂດຍສານ ລາວ-ຈີນ</p>
            <p className="text-lg text-blue-200">ຈອງປີ້ອອນລາຍ ງ່າຍ ແລະ ໄວ</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">ຈອງປີ້ດ່ວນ</h2>
              <p className="text-gray-600">ເລືອກວັນທີ ແລະ ຈຳນວນຜູ້ໂດຍສານ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">ຈຸດຂຶ້ນ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value="ຈຸດນັດພົບ"
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">ປາຍທາງ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value="ຕົວເມືອງ"
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">ວັນທີເດີນທາງ</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">ຈຳນວນຄົນ</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select 
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} ຄົນ</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleBookingRedirect}
                className="bg-blue-600 text-white px-12 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg flex items-center mx-auto"
              >
                ຄົ້ນຫາ ແລະ ຈອງ
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ພວກເຮົາເປັນທີ່ເຊື່ອຖື</h2>
            <p className="text-lg text-gray-600">ສະຖິຕິທີ່ສະແດງເຖິງຄຸນນະພາບຂອງບໍລິການ</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.customers.toLocaleString()}+</div>
              <div className="text-gray-600">ລູກຄ້າພໍໃຈ</div>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Bus className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.trips.toLocaleString()}+</div>
              <div className="text-gray-600">ການເດີນທາງ</div>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ThumbsUp className="h-12 w-12 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">{stats.satisfaction}%</div>
              <div className="text-gray-600">ຄວາມພໍໃຈ</div>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Award className="h-12 w-12 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.years}+</div>
              <div className="text-gray-600">ປີປະສົບການ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ເປັນຫຍັງຕ້ອງເລືອກເຮົາ?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ເຮົາມີບໍລິການທີ່ຄົບຄົນ ແລະ ທັນສະໄໝ ເພື່ອໃຫ້ການເດີນທາງຂອງທ່ານສະດວກ ແລະ ປອດໄພ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full inline-block mb-3">
                  {feature.highlight}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ບໍລິການຂອງເຮົາ</h2>
            <p className="text-lg text-gray-600">ບໍລິການຄົບຄົນສຳລັບການເດີນທາງຂອງທ່ານ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    {service.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{service.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Route Info Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">ເສັ້ນທາງ ແລະ ເວລາ</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">ຈຸດນັດພົບ - ຕົວເມືອງ</h3>
                    <p className="text-gray-600">ເສັ້ນທາງຫຼັກ ໄປ-ກັບ ທຸກມື້</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">ເວລາອອກ: 08:00 ໂມງເຊົ້າ</h3>
                    <p className="text-gray-600">ອອກເດີນທາງທຸກມື້ ຕົງເວລາ</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">ລາຄາ: 45,000 ກີບ/ຄົນ</h3>
                    <p className="text-gray-600">ລາຄາຄົງທີ່ ບໍ່ມີຄ່າບໍລິການເພີ່ມ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">ວິທີການຈອງ</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p className="ml-3 text-gray-700">ເລືອກວັນທີ ແລະ ຈຳນວນຜູ້ໂດຍສານ</p>
                </div>
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p className="ml-3 text-gray-700">ໃສ່ຂໍ້ມູນຜູ້ຕິດຕໍ່ ແລະ ຜູ້ໂດຍສານ</p>
                </div>
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p className="ml-3 text-gray-700">ໂອນເງິນ ແລະ ອັບໂຫລດສລິບ</p>
                </div>
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                  <p className="ml-3 text-gray-700">ຮັບປີ້ ແລະ ເດີນທາງ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ຄຳຄິດເຫັນຈາກລູກຄ້າ</h2>
            <p className="text-lg text-gray-600">ຟັງສີ່ງທີ່ລູກຄ້າຂອງເຮົາເວົ້າ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="flex items-center mb-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin & Staff Login Section */}
      <section className="py-16 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">ເຂົ້າສູ່ລະບົບ</h2>
            <p className="text-gray-300">ສຳລັບພະນັກງານ ແລະ ຜູ້ບໍລິຫານລະບົບ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Admin Login */}
            <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-xl p-6 text-center cursor-pointer group"
                 onClick={() => router.push('/login?role=admin')}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ຜູ້ບໍລິຫານ</h3>
              <p className="text-red-100 text-sm mb-4">Administrator</p>
              <p className="text-xs text-red-200">ຈັດການລະບົບທັງໝົດ</p>
            </div>

            {/* Staff Login */}
            <div className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl p-6 text-center cursor-pointer group"
                 onClick={() => router.push('/login?role=staff')}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ພະນັກງານ</h3>
              <p className="text-blue-100 text-sm mb-4">Staff</p>
              <p className="text-xs text-blue-200">ຂາຍປີ້ ແລະ ຈັດການການຈອງ</p>
            </div>

            {/* Driver Login */}
            <div className="bg-green-600 hover:bg-green-700 transition-colors rounded-xl p-6 text-center cursor-pointer group"
                 onClick={() => router.push('/login?role=driver')}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Bus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ຄົນຂັບລົດ</h3>
              <p className="text-green-100 text-sm mb-4">Driver</p>
              <p className="text-xs text-green-200">ເຊັກອິນ ແລະ ສະແກນປີ້</p>
            </div>

            {/* Station Login */}
            <div className="bg-purple-600 hover:bg-purple-700 transition-colors rounded-xl p-6 text-center cursor-pointer group"
                 onClick={() => router.push('/login?role=station')}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ສະຖານີ</h3>
              <p className="text-purple-100 text-sm mb-4">Station</p>
              <p className="text-xs text-purple-200">ຈັດການສະຖານີ ແລະ ລາຍຮັບ</p>
            </div>
          </div>

          {/* General Login Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/login')}
              className="bg-white text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center mx-auto"
            >
              <span className="mr-2">ເຂົ້າສູ່ລະບົບທົ່ວໄປ</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="text-gray-400 text-sm mt-2">
              ຫຼື ໃຊ້ຟອມ Login ມາດຕະຖານ
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">ຕິດຕໍ່ເຮົາ</h2>
              <p className="text-gray-300 mb-8">
                ມີຄຳຖາມ ຫຼື ຕ້ອງການຂໍ້ມູນເພີ່ມເຕີມ? ຕິດຕໍ່ມາຫາເຮົາໄດ້ທຸກເວລາ
              </p>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="h-6 w-6 text-blue-400 mr-3" />
                  <span>020 1234 5678</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-6 w-6 text-blue-400 mr-3" />
                  <span>info@busticket.la</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="h-6 w-6 text-blue-400 mr-3" />
                  <span>WhatsApp: +856 20 1234 5678</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-6">ສົ່ງຂໍ້ຄວາມຫາເຮົາ</h3>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="ຊື່ຂອງທ່ານ"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="ອີເມວ"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="ຂໍ້ຄວາມ"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  ສົ່ງຂໍ້ຄວາມ
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Bus className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-xl font-bold text-white">ລົດຕູ້ລາວ-ຈີນ</span>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">ເງື່ອນໄຂການໃຊ້ງານ</a>
              <a href="#" className="hover:text-white transition-colors">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</a>
              <span>© 2024 ລົດຕູ້ລາວ-ຈີນ. ສະຫງວນລິຂະສິດ.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => router.push('/booking')}
          className="bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center"
        >
          <Ticket className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
}