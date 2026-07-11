import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { MobileMarketShared } from './mobile-market-shared';

describe('MobileMarketShared', () => {
  let component: MobileMarketShared;
  let fixture: ComponentFixture<MobileMarketShared>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileMarketShared],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileMarketShared);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
