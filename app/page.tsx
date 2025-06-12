// app/page.tsx - Fixed Homepage Component
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  Bus, 
  Clock, 
  MapPin, 
  Star,
  Shield,
  CheckCircle,
  Phone,
  ArrowRight,
  Zap,
  Heart,
  Award,
  User,
  Mail,
  Search
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  const [passengerCount, setPassengerCount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [stats, setStats] = useState({
    totalTrips: 0,
    happyCustomers: 0,
    yearsOfService: 0
  });

  // Animation for statistics
  useEffect(() => {
    const animateStats = () => {
      const finalStats = { totalTrips: 1500, happyCustomers: 850, yearsOfService: 5 };
      const increment = 50;
      
      const timer = setInterval(() => {
        setStats(prev => ({
          totalTrips: Math.min(prev.totalTrips + increment, finalStats.totalTrips),
          happyCustomers: Math.min(prev.happyCustomers + Math.floor(increment * 0.6), finalStats.happyCustomers),
          yearsOfService: Math.min(prev.yearsOfService + 1, finalStats.yearsOfService)
        }));
      }, increment);

      setTimeout(() => clearInterval(timer), 2000);
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  // Testimonials data
  const testimonials = [
    {
      name: "ທ້າວ ສີລາວົງ",
      comment: "ບໍລິການດີເລີດ! ຄົນຂັບໃຈດີ ແລະ ປອດໄພ",
      rating: 5
    },
    {
      name: "ນາງ ບຸນມີ",
      comment: "ຈອງງ່າຍ ສະດວກຫຼາຍ ລາຄາເໝາະສົມ",
      rating: 5
    },
    {
      name: "ທ້າວ ວິໄລ",
      comment: "ມາຮອດກໍານົດເວລາ ບໍ່ເຄີຍປິດລູກຄ້າ",
      rating: 5
    }
  ];

  // Set minimum date to tomorrow
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Set max date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Handle booking submission
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      alert('ກະລຸນາເລືອກວັນທີເດີນທາງ');
      return;
    }

    if (!contactInfo.name.trim()) {
      alert('ກະລຸນາໃສ່ຊື່ຜູ້ຕິດຕໍ່');
      return;
    }

    if (!contactInfo.phone.trim()) {
      alert('ກະລຸນາໃສ່ເບີໂທຕິດຕໍ່');
      return;
    }

    setLoading(true);
    
    try {
      const requestBody = {
        passengerInfo: {
          name: contactInfo.name.trim(),
          phone: contactInfo.phone.trim(),
          email: contactInfo.email.trim() || undefined
        },
        tripDetails: {
          pickupLocation: 'ຈຸດນັດພົບ',
          destination: 'ຕົວເມືອງ',
          travelDate: selectedDate,
          travelTime: '08:00',
          passengers: parseInt(passengerCount)
        },
        basePrice: 45000
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/booking/${result.booking._id}/payment`);
      } else {
        alert(result.error || 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງການຈອງ');
      }
    } catch (error) {
      console.error('Network/JS Error:', error);
      alert('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ ກະລຸນາລອງໃໝ່');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bus className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">ລົດຕູ້ໂດຍສານ</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/booking/status')}
                className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                ກວດສອບສະຖານະປີ້
              </button>
              <a 
                href="tel:020-12345678"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Phone className="w-4 h-4 mr-1" />
                020-12345678
              </a>
              <div className="h-6 border-l border-gray-300"></div>
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <User className="w-4 h-4 mr-2" />
                ເຂົ້າສູ່ລະບົບ
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                ລົດຕູ້ໂດຍສານ<br/>
                <span className="text-yellow-300">ລາວ-ຈີນ</span>
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                ຈອງລ່ວງໜ້າ ສະດວກ ປອດໄພ ແລະ ເຊື່ອຖື
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span>ຈອງອອນລາຍ 24/7</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span>ລາຄາເໝາະສົມ</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span>ຄົນຂັບມີປະສົບການ</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span>ບໍລິການ 24 ຊົ່ວໂມງ</span>
                </div>
              </div>
            </div>

            {/* Complete Booking Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-gray-900 max-w-2xl w-full">
              <h3 className="text-2xl font-bold mb-6 text-center">ຈອງປີ້ດຽວນີ້</h3>
              
              <form onSubmit={handleBooking} className="space-y-6">
                {/* Trip Details */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm text-blue-800">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>ຈຸດນັດພົບ → ຕົວເມືອງ</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>08:00 ໂມງເຊົ້າ</span>
                    </div>
                  </div>
                </div>

                {/* Date and Passenger Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      ເລືອກວັນທີເດີນທາງ
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getTomorrowDate()}
                      max={getMaxDate()}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 mr-2 text-green-600" />
                      ຈຳນວນຜູ້ໂດຍສານ
                    </label>
                    <select
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1} ຄົນ
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">ຂໍ້ມູນຜູ້ຕິດຕໍ່</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        ຊື່ຂອງທ່ານ *
                      </label>
                      <input
                        type="text"
                        value={contactInfo.name}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ໃສ່ຊື່ຜູ້ຕິດຕໍ່"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        ເບີໂທຕິດຕໍ່ *
                      </label>
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="020 1234 5678"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 mr-2 text-purple-600" />
                      ອີເມວ (ບໍ່ບັງຄັບ)
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">ລາຄາຕໍ່ຄົນ:</span>
                    <span className="font-bold text-blue-600">₭45,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ລາຄາລວມ ({passengerCount} ຄົນ):</span>
                    <span className="text-xl font-bold text-green-600">
                      ₭{(45000 * parseInt(passengerCount)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      ຢືນຢັນການຈອງ
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                * ການຈອງໝົດອາຍຸພາຍໃນ 24 ຊົ່ວໂມງ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">ຄວາມເຊື່ອໝັ້ນຈາກລູກຄ້າ</h3>
            <p className="text-gray-600">ຕົວເລກທີ່ສະແດງເຖິງຄຸນນະພາບບໍລິການຂອງພວກເຮົາ</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalTrips.toLocaleString()}+</div>
              <div className="text-gray-600">ການເດີນທາງທີ່ສຳເລັດ</div>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.happyCustomers.toLocaleString()}+</div>
              <div className="text-gray-600">ລູກຄ້າທີ່ພໍໃຈ</div>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.yearsOfService}+</div>
              <div className="text-gray-600">ປີແຫ່ງປະສົບການ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">ເປັນຫຍັງຈຶ່ງເລືອກພວກເຮົາ?</h3>
            <p className="text-gray-600">ບໍລິການທີ່ເຮົາພ້ອມໃຫ້ທ່ານ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">ຈອງໄວ ງ່າຍ</h4>
              <p className="text-gray-600">
                ຈອງອອນລາຍພຽງ 2-3 ນາທີ ແລະ ຮັບການຢືນຢັນທັນທີ
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">ປອດໄພ ເຊື່ອຖື</h4>
              <p className="text-gray-600">
                ຄົນຂັບມີປະສົບການ ລົດທຸກຄັນຜ່ານການກວດສອບ
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">ຕົງເວລາ ແນ່ນອນ</h4>
              <p className="text-gray-600">
                ອອກເດີນທາງຕົງເວລາ ບໍ່ປິດລູກຄ້າ ບໍລິການ 24 ຊົ່ວໂມງ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">ຄຳຕິຊົມຈາກລູກຄ້າ</h3>
            <p className="text-gray-600">ຟັງຄວາມຄິດເຫັນຈາກຜູ້ທີ່ເຄີຍໃຊ້ບໍລິການ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, starIndex) => (
                    <Star key={starIndex} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
                <div className="font-medium text-gray-900">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold mb-4">ພ້ອມເດີນທາງແລ້ວບໍ?</h3>
          <p className="text-xl mb-8 text-blue-100">
            ຈອງດຽວນີ້ເພື່ອຮັບປະກັນບ່ອນນັ່ງຂອງທ່ານ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/booking')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              ຈອງດຽວນີ້
            </button>
            <button
              onClick={() => router.push('/booking/status')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              ກວດສອບສະຖານະ
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Bus className="w-8 h-8 text-blue-400 mr-3" />
                <h4 className="text-xl font-bold">ລົດຕູ້ໂດຍສານ</h4>
              </div>
              <p className="text-gray-400">
                ບໍລິການລົດຕູ້ໂດຍສານທີ່ເຊື່ອຖືໄດ້ ເພື່ອການເດີນທາງທີ່ປອດໄພ ແລະ ສະດວກສະບາຍ
              </p>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">ຕິດຕໍ່ພວກເຮົາ</h5>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>020-12345678</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>ສະຖານີລົດໄຟ ລາວ-ຈີນ</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">ບໍລິການ</h5>
              <ul className="space-y-2 text-gray-400">
                <li>ລົດຕູ້ໂດຍສານ</li>
                <li>ຈອງລ່ວງໜ້າ</li>
                <li>ບໍລິການ 24 ຊົ່ວໂມງ</li>
                <li>ສະໜັບສະໜູນລູກຄ້າ</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ລົດຕູ້ໂດຍສານ. ສະຫງວນລິຂະສິດທັງໝົດ.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}