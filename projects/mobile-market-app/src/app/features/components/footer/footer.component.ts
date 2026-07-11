import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

interface FooterLink {
  label: string;
  route?: string;
  href?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  label: string;
  icon: string;
  url: string;
}

@Component({
  selector: 'm-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideDynamicIcon],
})
export class FooterComponent {
  readonly socials: SocialLink[] = [
    { label: 'Facebook', icon: 'facebook', url: 'https://facebook.com' },
    { label: 'Instagram', icon: 'instagram', url: 'https://instagram.com' },
    { label: 'YouTube', icon: 'youtube', url: 'https://youtube.com' },
    { label: 'Telegram', icon: 'send', url: 'https://t.me' },
  ];

  readonly footerColumns: FooterColumn[] = [
    {
      title: 'Каталог',
      links: [
        { label: 'Смартфоны', route: '/catalog/smartphones' },
        { label: 'Планшеты', route: '/catalog/tablets' },
        { label: 'Ноутбуки', route: '/catalog/laptops' },
        { label: 'Аксессуары', route: '/catalog/accessories' },
        { label: 'Умные часы', route: '/catalog/smartwatches' },
        { label: 'Новинки', route: '/new' },
        { label: 'Акции', route: '/sale' },
      ],
    },
    {
      title: 'Компания',
      links: [
        { label: 'О нас', route: '/about' },
        { label: 'Контакты', route: '/contacts' },
        { label: 'Магазины', route: '/stores' },
        { label: 'Доставка', route: '/delivery' },
        { label: 'Гарантия', route: '/warranty' },
        { label: 'Возврат', route: '/returns' },
      ],
    },
    {
      title: 'Помощь',
      links: [
        { label: 'Отслеживание заказа', route: '/orders/track' },
        { label: 'Оплата', route: '/payment' },
        { label: 'FAQ', route: '/faq' },
        { label: 'Trade-In', route: '/trade-in' },
        { label: 'Gift Card', route: '/gift-card' },
      ],
    },
  ];

  readonly payments: string[] = ['VISA', 'Mastercard', 'PayPal'];
}
