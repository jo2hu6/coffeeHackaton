import { elementEventFullName } from '@angular/compiler/src/view_compiler/view_compiler';
import { Component, OnInit } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import { GuestService } from 'src/app/services/guest.service';

declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit {

  public token;

  public direccion: any = {
    pais: '',
    region: '',
    provincia: '',
    distrito: '',
    principal: false
  };

  public direcciones: Array<any> = [];

  public regiones: Array<any> = [];
  public provincias: Array<any> = [];
  public distritos: Array<any> = [];

  public regiones_arr: Array<any> = [];
  public provincias_arr: Array<any> = [];
  public distritos_arr: Array<any> = [];

  public load_data = true;

  constructor(
    private _guestService: GuestService,
    private _clienteService: ClienteService
  ) {
    this.token = localStorage.getItem('token');

    this._guestService.get_regiones().subscribe(
      response => {
        this.regiones_arr = response;
      }
    );

    this._guestService.get_provincias().subscribe(
      response => {
        this.provincias_arr = response;
      }
    );

    this._guestService.get_distritos().subscribe(
      response => {
        this.distritos_arr = response;
      }
    );

  }

  ngOnInit(): void {
    this.obtener_direccion();
  }

  obtener_direccion(){
    this._clienteService.obtener_direcciones_todos_cliente(localStorage.getItem('_id'),this.token).subscribe(
      response=>{
        this.direcciones = response.data;
        this.load_data = false;
      }
    );
  }

  select_pais() {
    if (this.direccion.pais == 'Perú') {
      $('#sl-region').prop('disabled', false);
      this._guestService.get_regiones().subscribe(
        response => {
          response.forEach((p: any) => {
            this.regiones.push({
              id: p.id,
              name: p.name
            });
          });
        }
      );
    } else {
      $('#sl-region').prop('disabled', true);
      $('#sl-provincia').prop('disabled', true);
      this.regiones = [];
      this.provincias = [];
      this.direccion.region = '';
      this.direccion.provincia = '';
    }
  }

  select_region() {
    this.provincias = [];
    $('#sl-provincia').prop('disabled', false);
    $('#sl-distrito').prop('disabled', true);
    this.direccion.provincia = '';
    this.direccion.distrito = '';
    this._guestService.get_provincias().subscribe(
      response => {
        response.forEach((r: any) => {
          if (r.department_id == this.direccion.region) {
            this.provincias.push(r);
          }
        });
        console.log(this.provincias);

      }
    );
  }

  select_provincia() {
    this.distritos = [];
    $('#sl-distrito').prop('disabled', false);
    this.direccion.distrito = '';
    this._guestService.get_distritos().subscribe(
      response => {
        response.forEach((r: any) => {
          if (r.province_id == this.direccion.provincia) {
            this.distritos.push(r);
          }
        });
        console.log(this.provincias);
      }
    );
  }

  registrar(registroForm: any) {
    if (registroForm.valid) {

      this.regiones_arr.forEach((e:any)=>{
        if(e.id == parseInt(this.direccion.region)){
          this.direccion.region = e.name;
        }
      });

      this.provincias_arr.forEach((e:any)=>{
        if(e.id == parseInt(this.direccion.provincia)){
          this.direccion.provincia = e.name;
        }
      });

      this.distritos_arr.forEach((e:any)=>{
        if(e.id == parseInt(this.direccion.distrito)){
          this.direccion.distrito = e.name;
        }
      });

      let data = {
        destinatario: this.direccion.destinatario,
        dni: this.direccion.dni,
        zip: this.direccion.zip,
        direccion: this.direccion.direccion,
        telefono: this.direccion.telefono,
        pais: this.direccion.pais,
        region: this.direccion.region,
        provincia: this.direccion.provincia,
        distrito: this.direccion.distrito,
        principal: this.direccion.principal,
        cliente: localStorage.getItem('_id')
      } 

      this._clienteService.registro_direccion_cliente(data,this.token).subscribe(
        response=>{
          this.direccion = {
            pais: '',
            region: '',
            provincia: '',
            distrito: '',
            principal: false
          };
          $('#sl-region').prop('disabled', true);
          $('#sl-provincia').prop('disabled', true);
          $('#sl-distrito').prop('disabled', true);

          iziToast.show({
            title: 'SUCCESS',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Dirección agregada correctamente.'
          });
          this.obtener_direccion();
        }
      );

      console.log(data);
      
    } else {
      iziToast.show({
        title: 'ERROR',
        titleColor: '#FF0000',
        class: 'text-danger',
        position: 'topRight',
        message: 'Los datos no son válidos.'
      });
    }
  }

  establecer_principal(id:any){
    this._clienteService.cambiar_direccion_principal_cliente(id,localStorage.getItem('_id'),this.token).subscribe(
      reponse=>{
        this.obtener_direccion();
        iziToast.show({
          title: 'SUCCESS',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Dirección principal actualizada.'
        });
      }
    );
  }

}
