import type { MenuItem } from './types'

export const menuItems: MenuItem[] = [
  {
    "id": "offers-1",
    "category": "العروض",
    "name": "وجبة الغداء",
    "description": "طبق رئيسي + أرز + سلطة + مشروب",
    "price": 99,
    "oldPrice": 130,
    "chickenChoice": true,
    "image": "/imgs/default.webp"
  },
  {
    "id": "offers-2",
    "category": "العروض",
    "name": "وجبة الصحاب",
    "description": "ربع فرخة مشوية + تمن كفتة + أرز + عيش + سلطات",
    "price": 130,
    "oldPrice": 160,
    "chickenChoice": true,
    "image": "/imgs/default.webp"
  },
  {
    "id": "offers-3",
    "category": "العروض",
    "name": "بوكس السندوتشات",
    "description": "3 سندوتشات + بطاطس + مخلل",
    "price": 120,
    "oldPrice": 150,
    "image": "/imgs/default.webp"
  },
  {
    "id": "main-1",
    "category": "الأطباق الرئيسية",
    "name": "فراخ مشوية",
    "description": "فرخة متبلة ومشوية على الفحم",
    "sizes": [
      {
        "id": "s1",
        "name": "ربع فرخة",
        "price": 70
      },
      {
        "id": "s2",
        "name": "نص فرخة",
        "price": 130
      },
      {
        "id": "s3",
        "name": "فرخة كاملة",
        "price": 250
      }
    ],
    "image": "/imgs/default.webp"
  },
  {
    "id": "main-2",
    "category": "الأطباق الرئيسية",
    "name": "كفتة مشوية",
    "description": "كفتة طازجة مشوية",
    "sizes": [
      {
        "id": "s1",
        "name": "ربع كيلو",
        "price": 115
      },
      {
        "id": "s2",
        "name": "نص كيلو",
        "price": 225
      },
      {
        "id": "s3",
        "name": "كيلو",
        "price": 450
      }
    ],
    "image": "/imgs/default.webp"
  },
  {
    "id": "main-3",
    "category": "الأطباق الرئيسية",
    "name": "مكس جريل",
    "description": "كفتة + فراخ + طرب مشوي",
    "price": 160,
    "image": "/imgs/default.webp"
  },
  {
    "id": "main-4",
    "category": "الأطباق الرئيسية",
    "name": "أرز بالخلطة",
    "description": "أرز مطبوخ بالخلطة والمكسرات",
    "price": 45,
    "image": "/imgs/default.webp"
  },
  {
    "id": "sandwich-1",
    "category": "السندوتشات",
    "name": "كفتة مشوي",
    "description": "ساندوتش كفتة مع طحينة وسلطة",
    "price": 35,
    "image": "/imgs/default.webp"
  },
  {
    "id": "sandwich-2",
    "category": "السندوتشات",
    "name": "سجق مشوي",
    "description": "ساندوتش سجق مع بطاطس",
    "price": 40,
    "image": "/imgs/default.webp"
  },
  {
    "id": "sandwich-3",
    "category": "السندوتشات",
    "name": "كبدة",
    "description": "ساندوتش كبدة مع سلطة",
    "price": 40,
    "image": "/imgs/default.webp"
  },
  {
    "id": "sandwich-4",
    "category": "السندوتشات",
    "name": "فراخ",
    "description": "ساندوتش صدور فراخ مع صوص الثوم",
    "price": 45,
    "image": "/imgs/default.webp"
  },
  {
    "id": "starter-1",
    "category": "المقبلات والسلطات",
    "name": "سلطة خضراء",
    "price": 20,
    "image": "/imgs/default.webp"
  },
  {
    "id": "starter-2",
    "category": "المقبلات والسلطات",
    "name": "طحينة",
    "price": 15,
    "image": "/imgs/default.webp"
  },
  {
    "id": "starter-3",
    "category": "المقبلات والسلطات",
    "name": "بطاطس مقلية",
    "price": 30,
    "image": "/imgs/default.webp"
  },
  {
    "id": "drink-1",
    "category": "المشروبات",
    "name": "مياه معدنية",
    "price": 8,
    "image": "/imgs/default.webp"
  },
  {
    "id": "drink-2",
    "category": "المشروبات",
    "name": "مشروب غازي",
    "price": 15,
    "image": "/imgs/default.webp"
  },
  {
    "id": "drink-3",
    "category": "المشروبات",
    "name": "شاي",
    "price": 10,
    "image": "/imgs/default.webp"
  }
]
