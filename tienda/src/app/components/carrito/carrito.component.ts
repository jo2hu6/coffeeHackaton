import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import { GLOBAL } from 'src/app/services/GLOBAL';
import { io } from "socket.io-client";
import { GuestService } from 'src/app/services/guest.service';
import { ShowProductoComponent } from '../productos/show-producto/show-producto.component';
import { Router } from '@angular/router';

declare var iziToast: any;
declare var Cleave: any;
declare var StickySidebar: any;
declare var paypal: any;

interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {

  @ViewChild('paypalButton', { static: true }) paypalElement: ElementRef | any;

  public idCliente;
  public token;
  public carrito_arr: Array<any> = [];
  public url;
  public sub_total = 0;
  public total_pagar: any = 0;
  public socket = io('http://localhost:4201');
  public direccion_principal: any = {};
  public envios: Array<any> = [];
  public precio_envio = "0";
  public venta: any = {};
  public dventa: Array<any> = [];
  public card_data: any = {};
  public btn_load = false;
  public carrito_load = true;
  public user: any = {};
  public error_cupon = '';
  public descuento = 0;
  public descuento_activo: any = undefined;

  constructor(
    private _clienteService: ClienteService,
    private _guestService: GuestService,
    private _router: Router
  ) {
    this.url = GLOBAL.url;
    this.token = localStorage.getItem('token');
    this.idCliente = localStorage.getItem('_id');
    this.venta.cliente = this.idCliente;

    this._guestService.get_envios().subscribe(
      response => {
        this.envios = response;
      }
    );

    this.user = JSON.parse(localStorage.getItem('user_data')!);
  }

  ngOnInit(): void {

    this._guestService.obtener_descuento_activo().subscribe(
      response => {

        if (response.data != undefined) {
          this.descuento_activo = response.data[0];
        } else {
          this.descuento_activo = undefined;
        }
      }
    );

    this.init_data();
    setTimeout(() => {
      new Cleave('#cc-number', {
        creditCard: true,
        onCreditCardTypeChanged: function (type: any) {
          // update UI ...
        }
      });

      new Cleave('#cc-exp-date', {
        date: true,
        datePattern: ['m', 'Y']
      });

      new StickySidebar('.sidebar-sticky', { topSpacing: 20 });
    });

    this.get_direccion_principal();

    paypal.Buttons({
      style: {
        layout: 'horizontal'
      },
      createOrder: (data: any, actions: any) => {

        return actions.order.create({
          purchase_units: [{
            description: 'Pago en eCommerce Tongod',
            amount: {
              currency_code: 'USD',
              value: this.sub_total
            },
          }]
        });

      },
      onApprove: async (data: any, actions: any) => {
        const order = await actions.order.capture();

        this.venta.transaccion = order.purchase_units[0].payments.captures[0].id;

        this.venta.detalles = this.dventa;
        this._clienteService.registro_compra_cliente(this.venta, this.token).subscribe(
          response => {
            this._clienteService.enviar_correo_compra_cliente(response.venta._id, this.token).subscribe(
              response => {
                this._router.navigate(['/']);
              }
            );
          }
        );
      },
      onError: (err: any) => {

      },
      onCancel: function (data: any, actions: any) {

      }
    }).render(this.paypalElement.nativeElement);

  }

  init_data() {
    this._clienteService.obtener_carrito_cliente(this.idCliente, this.token).subscribe(
      response => {
        console.log(response);
        this.carrito_arr = response.data;

        this.carrito_arr.forEach(element => {
          this.dventa.push({
            producto: element.producto._id,
            subtotal: element.producto.precio * element.cantidad,
            variedad: element.variedad,
            cantidad: element.cantidad,
            cliente: localStorage.getItem('_id')
          });
        });
        this.carrito_load = false;
        this.calcular_carrito();
        this.calcular_total('Recojo en Tienda');
      }
    );
  }

  get_direccion_principal() {
    this._clienteService.obtener_direccion_principal_cliente(localStorage.getItem('_id'), this.token).subscribe(
      response => {
        if (response.data == undefined) {
          this.direccion_principal = undefined;
        } else {
          this.direccion_principal = response.data;
          this.venta.direccion = this.direccion_principal._id;
        }

      }
    );
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
        this.init_data();
      }
    );
  }

  calcular_total(envio_titulo: any) {
    this.total_pagar = parseInt(this.sub_total.toString()) + parseInt(this.precio_envio);
    this.venta.subtotal = this.total_pagar;
    this.venta.envio_precio = parseInt(this.precio_envio);
    this.venta.envio_titulo = envio_titulo;

    console.log(this.venta);

  }

  get_token_culqi() {

    let month, year, exp_arr = this.card_data.exp.split('/');

    let data = {
      "card_number": this.card_data.ncard.toString().replace(/ /g, "").substr(0, 16),
      "cvv": this.card_data.cvc,
      "expiration_month": exp_arr[0],
      "expiration_year": exp_arr[1].toString().substr(0, 4),
      "email": this.user.email
    }
    this.btn_load = true;
    this._clienteService.get_token_culqi(data).subscribe(
      response => {
        let charge = {
          "amount": this.sub_total + '00',
          "currency_code": "PEN",
          "email": this.user.email,
          "source_id": response.id
        }
        this._clienteService.get_charge_culqi(charge).subscribe(
          response => {
            this.venta.transaccion = response.id;

            this.venta.detalles = this.dventa;
            this._clienteService.registro_compra_cliente(this.venta, this.token).subscribe(
              response => {
                this.btn_load = false;

                this._clienteService.enviar_correo_compra_cliente(response.venta._id, this.token).subscribe(
                  response => {
                    this._router.navigate(['/']);
                  }
                );

              }
            );

          }
        );
      }
    );

  }

  validar_cupon() {
    if (this.venta.cupon) {
      if (this.venta.cupon.toString().length <= 25) {
        this._clienteService.validar_cupon_cliente(this.venta.cupon, this.token).subscribe(
          response => {
            if (response.data != undefined) {
              this.error_cupon = '';

              if (response.data.tipo == 'Valor fijo') {
                this.descuento = response.data.valor;
                if (this.total_pagar <= response.data.valor) {
                  this.total_pagar = 0;
                } else {
                  this.total_pagar -= this.descuento;
                }
              } else if (response.data.tipo == 'Porcentaje') {
                this.descuento = (this.total_pagar * response.data.valor) / 100;
                this.total_pagar -= this.descuento;
              }

            } else {
              this.error_cupon = 'El cupón no se pudo canjear.'
            }

          }
        );
      } else {
        this.error_cupon = 'El cupón debe ser menos de 25 caracteres.'
      }
    } else {
      this.error_cupon = 'El cupón no es válido.'
    }
  }

}
