import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { GLOBAL } from 'src/app/services/GLOBAL';
import { io } from "socket.io-client";
import { GuestService } from 'src/app/services/guest.service';

declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  public token;
  public id;
  public user: any = undefined;
  public user_lc: any = undefined;
  public config_global: any = {};
  public op_cart = false;
  public carrito_arr: Array<any> = [];
  public url;
  public sub_total = 0;
  public socket = io('http://localhost:4201');
  public descuento_activo: any = undefined;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
    private _guestService: GuestService
  ) {
    this.url = GLOBAL.url;
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');

    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }
    )

    if (this.token) {
      this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
        response => {
          this.user = response.data;
          localStorage.setItem('user_data', JSON.stringify(this.user));
          if (localStorage.getItem('user_data')) {
            this.user_lc = JSON.parse(localStorage.getItem('user_data') || '{}');
            this.obtener_carrito();
          } else {
            this.user_lc = undefined;
          }
        },
        error => {
          this.user = undefined;
        }
      );
    }

  }

  ngOnInit() {

    this.socket.on('new-carrito', (data: any) => {
      this.obtener_carrito();
    });

    this.socket.on('new-carrito-add', (data: any) => {
      this.obtener_carrito();
    });

    this._guestService.obtener_descuento_activo().subscribe(
      response => {

        if (response.data != undefined) {
          this.descuento_activo = response.data[0];
        } else {
          this.descuento_activo = undefined;
        }
      }
    );

  }

  obtener_carrito() {
    this._clienteService.obtener_carrito_cliente(this.user_lc._id, this.token).subscribe(
      response => {
        this.carrito_arr = response.data;
        this.calcular_carrito();
      }
    );
  }

  logout() {
    window.location.reload();
    localStorage.clear();
    this._router.navigate(['/']);
  }

  op_modalCart() {
    if (!this.op_cart) {
      this.op_cart = true;
      $('#cart').addClass('show');
    } else {
      this.op_cart = false;
      $('#cart').removeClass('show');
    }
  }

  calcular_carrito() {
    this.sub_total = 0;
    if (this.descuento_activo == undefined) {
      this.carrito_arr.forEach(element => {
        this.sub_total += parseInt(element.producto.precio) * (element.cantidad);
      });
    } else if (this.descuento_activo != undefined) {
      this.carrito_arr.forEach(element => {
        let precio_cantidad = parseInt(element.producto.precio) * element.cantidad;
        let new_precio = Math.round(precio_cantidad - (precio_cantidad * this.descuento_activo.descuento) / 100);
        this.sub_total = this.sub_total + new_precio;
      });
    }
  }


  eliminar_item(id: any) {
    this._clienteService.eliminar_carrito_cliente(id, this.token).subscribe(
      response => {
        iziToast.show({
          title: 'SUCCESS',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Producto eliminado del carrito.'
        });
        this.socket.emit('delete-carrito', { data: response.data });
      }
    );
  }

}

