/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Directive, ElementRef, Input, OnInit} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';

@Directive({
  selector: '[appDropdown]'
})
export class DropdownDirective implements OnInit {

  isInHoverBlock = false;

  @Input() hoverTrigger: MatMenuTrigger;
  @Input() menu: any;

  constructor(private el: ElementRef) { }

  ngOnInit() {
    if (window.innerWidth > 768) {
      this.el.nativeElement.addEventListener('mouseenter', () => {

        this.setHoverState(true);
        this.hoverTrigger.openMenu();
        let openMenu;
        if (document.querySelector(`.mat-menu-before.${this.menu._elementRef.nativeElement.className}`)) {
          openMenu = document.querySelector(`.mat-menu-before.${this.menu._elementRef.nativeElement.className}`);
        } else {
          openMenu = document.querySelector(`.mat-menu-after.${this.menu._elementRef.nativeElement.className}`);
        }
        if (!openMenu) {
          this.hoverTrigger.closeMenu();
          return;
        }
        openMenu.addEventListener('mouseenter', () => {
          this.setHoverState(true);
        });
        openMenu.addEventListener('mouseleave', () => {
          this.setHoverState(false);
        });
      });
    }
    this.el.nativeElement.addEventListener('mouseleave', () => {
      this.setHoverState(false);
    });
  }

  private setHoverState(isInBlock: boolean) {
    this.isInHoverBlock = isInBlock;
    if (!isInBlock) {
      this.checkHover();
    }
  }

  private checkHover() {
    setTimeout(() => {
      if (!this.isInHoverBlock && this.hoverTrigger.menuOpen) {
        this.hoverTrigger.closeMenu();
      }
    }, 500);
  }
}



