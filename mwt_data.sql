--
-- PostgreSQL database dump
--

\restrict Gcxu0KymfnngJB1IKdPnJvtdcbSiqUvZOo8t1QEPdvfFzqRHi4yn3qVcQ41rueO

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
25982e31-4141-4b36-9026-92f3d02aa3a9	87b5d899a9859d4c3a12a469075354442a0a64dd0d786f6cac7de18d2c4dfba6	2026-05-20 23:19:45.078253-06	20260314164718_init_sistema_mwt	\N	\N	2026-05-20 23:19:44.731508-06	1
7c063169-a6ac-4829-ae6c-984127e9bb94	a43072281433b56746b6c58cfbdfd343a65a3d342510aebedd34615d219760ef	2026-05-20 23:20:01.736589-06	20260521052001_mwt_db_migration	\N	\N	2026-05-20 23:20:01.614549-06	1
32d385bb-9e39-4a0e-aa12-9aae8758dd29	47abfddeeb70713380fddbf951c04a25cdea0a2fffcc4b4db540c4f80709d996	2026-05-21 14:32:36.193946-06	20260521090000_inscripcion_motocicleta_historial	\N	\N	2026-05-21 14:32:36.022413-06	1
176db2b9-8911-41a0-801e-c69012a8cd95	5c6011ccddc23d9cd515676fa0525f3eeb98d8cb016aee0a6c8573218d7b0f43	2026-09-20 19:00:40.396876-06	20260920120000_resultado_vueltas_completadas	\N	\N	2026-09-20 19:00:40.382348-06	1
4cb77de3-2e30-4a60-ae63-2e442d1dc179	9b031503b7815b4e8ba8446587154c2eafaf1d4e4f68df6a22bd8cba710c9d61	2026-10-27 11:25:12.318548-06	20261027113000_optional_inscripcion_motocicleta	\N	\N	2026-10-27 11:25:12.267409-06	1
\.


--
-- Data for Name: campeonatos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campeonatos (id, nombre, anio, descripcion, esta_activo) FROM stdin;
02e6b00c-dd46-44df-bd42-8c38494ab748	Campeonato ACMG 2026	2026	modalidad:ACMG	t
3c3af9e2-522d-4264-bddc-2f3d1a764e6c	COPA YAMAHA 2026	2026	modalidad:YAMAHA	t
86361bcf-d2e8-4512-95bc-87b4e14c5caf	Campeonato Nacional MWT	2026	\N	t
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias (id, campeonato_id, nombre, cilindrada_min, cilindrada_max, descripcion, precio_inscripcion) FROM stdin;
8e14eecf-e596-4e48-a6ec-625f4d67fe26	02e6b00c-dd46-44df-bd42-8c38494ab748	125cc Stock	100	125	Motor stock original de fabrica. Maximo 10% sobre cilindrada.	500
45e9d91c-f550-469b-a342-0dd5fdd63f0c	02e6b00c-dd46-44df-bd42-8c38494ab748	160cc Stock	126	160	Motor stock original de fabrica.	500
2b195287-2fc7-4622-bec8-8f7b305454d7	02e6b00c-dd46-44df-bd42-8c38494ab748	160cc Libre	126	175	Libre con bloque original. Street + Avanzados + PRO.	600
d29fcc5e-4618-482f-b745-d76255c17475	02e6b00c-dd46-44df-bd42-8c38494ab748	200cc Stock	176	200	Motor stock original de fabrica.	550
18d51b3d-99bc-4696-8275-7c8053362ff5	02e6b00c-dd46-44df-bd42-8c38494ab748	200cc Libre	176	210	Libre con bloque original.	650
d2b40d33-ad83-4360-b050-7186172377ad	02e6b00c-dd46-44df-bd42-8c38494ab748	R3 Avanzados	300	400	Yamaha R3 y similares. Con clasificacion.	800
d104985a-d337-4c13-8d8d-b20a4fa98be0	02e6b00c-dd46-44df-bd42-8c38494ab748	600cc Street (Novatos)	401	650	Novatos en 600cc. Sin clasificacion.	1000
113f73a2-f375-46b5-92d9-863a23a8aadd	02e6b00c-dd46-44df-bd42-8c38494ab748	600cc Avanzados	401	650	Intermedios en 600cc. Con clasificacion.	1000
a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	600cc PRO (Expertos)	401	650	Expertos en 600cc. Con clasificacion.	1100
3c0f72c0-0648-46b7-b820-c1634bcb7164	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	125cc Stock	100	125	Motor stock original de fabrica. Maximo 10% sobre cilindrada.	500
7b7fa812-a13d-4e9c-9c2d-44f6e5ff9545	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	160cc Stock	126	160	Motor stock original de fabrica.	500
19f9b0a8-376f-4108-9f2a-97369a04cebe	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	160cc Libre	126	175	Libre con bloque original. Street + Avanzados + PRO.	600
dcfd329d-d1d4-45e8-94c5-78ce227322b8	86361bcf-d2e8-4512-95bc-87b4e14c5caf	125cc Stock	100	125	Motor stock original de fabrica. Maximo 10% sobre cilindrada.	500
5b6b4534-cb55-4d80-8673-d00c0291e468	86361bcf-d2e8-4512-95bc-87b4e14c5caf	160cc Stock	126	160	Motor stock original de fabrica.	500
1a3d18dd-1e00-46d0-b7df-ab0103f21e98	86361bcf-d2e8-4512-95bc-87b4e14c5caf	160cc Libre	126	175	Libre con bloque original. Street + Avanzados + PRO.	600
a7aa77dd-01c6-4869-9e4a-afc9852ece21	86361bcf-d2e8-4512-95bc-87b4e14c5caf	200cc Stock	176	200	Motor stock original de fabrica.	550
54e41a44-45a3-4c43-81ef-6eb6f34ea4c2	86361bcf-d2e8-4512-95bc-87b4e14c5caf	200cc Libre	176	210	Libre con bloque original.	650
88472024-a1fe-431f-821c-c2a9145fe001	86361bcf-d2e8-4512-95bc-87b4e14c5caf	R3 Avanzados	300	400	Yamaha R3 y similares. Con clasificacion.	800
171191e9-ac7d-43c5-b0cb-95346f9aa706	86361bcf-d2e8-4512-95bc-87b4e14c5caf	600cc Street (Novatos)	401	650	Novatos en 600cc. Sin clasificacion.	1000
d2a55f34-6fc4-4a54-a035-94f8ed4c1ed5	86361bcf-d2e8-4512-95bc-87b4e14c5caf	600cc Avanzados	401	650	Intermedios en 600cc. Con clasificacion.	1000
b7f4c8c9-a48b-4f19-9d04-ce12c2a51a58	86361bcf-d2e8-4512-95bc-87b4e14c5caf	600cc PRO (Expertos)	401	650	Expertos en 600cc. Con clasificacion.	1100
\.


--
-- Data for Name: circuitos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.circuitos (id, nombre, ubicacion_url, longitud_km, numero_curvas, foto_mapa_url, esta_activo) FROM stdin;
circ-01	Autódromo Los Volcanes	https://maps.google.com/?q=autodromo+los+volcanes+guatemala	3.2	14	\N	t
\.


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eventos (id, campeonato_id, circuito_id, nombre, fecha_inicio, fecha_fin, estado, visible_portada, costo_base) FROM stdin;
44c3d56c-165d-486d-a571-676e3f8ae44d	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 2a Fecha	2026-02-22 00:00:00	2026-02-22 00:00:00	BORRADOR	f	0
632508e2-8a71-4e0c-b32f-b14f7b6e2808	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 1a Fecha	2026-01-25 00:00:00	2026-01-26 00:00:00	ABIERTO	t	250
ab583f7d-3c7c-4e95-b7cb-3857cd4e1c0f	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 1a Fecha	2026-02-08 00:00:00	2026-02-08 23:59:59	BORRADOR	f	0
17b86f4a-d236-4b48-9f94-0e669de020d7	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 2a Fecha	2026-03-15 00:00:00	2026-03-15 23:59:59	BORRADOR	f	0
e4dd2371-688f-4ece-9284-85d00f580c42	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 3a Fecha	2026-03-29 00:00:00	2026-03-29 23:59:59	BORRADOR	f	0
82c4b427-9b48-4077-9380-cc4263612c40	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 3a Fecha	2026-04-12 00:00:00	2026-04-12 23:59:59	BORRADOR	f	0
e523eb5a-a32a-4da3-a0f4-18654b007042	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 4a Fecha	2026-04-26 00:00:00	2026-04-26 23:59:59	BORRADOR	f	0
edc5c89f-3123-4317-9f39-23c7f3c13157	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 4a Fecha	2026-05-17 00:00:00	2026-05-17 23:59:59	BORRADOR	f	0
6f6735d0-b114-41f5-bea0-28281252dc9c	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 5a Fecha	2026-05-31 00:00:00	2026-05-31 23:59:59	BORRADOR	f	0
9490f382-f4ad-4786-930b-6682ebed785e	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 5a Fecha	2026-06-14 00:00:00	2026-06-14 23:59:59	BORRADOR	f	0
c84832fa-4e11-4357-b0a0-d5e85f2d1259	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 6a Fecha	2026-07-26 00:00:00	2026-07-26 23:59:59	BORRADOR	f	0
9ac25850-18b6-434a-aba8-c1e8a7dcb476	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 6a Fecha	2026-07-19 00:00:00	2026-07-19 23:59:59	BORRADOR	f	0
68609983-c33a-4aec-b94c-a47627cd4e23	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 7a Fecha	2026-09-27 00:00:00	2026-09-27 23:59:59	BORRADOR	f	0
cd24b045-a288-4fc6-be91-199c1f4910ad	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 7a Fecha	2026-08-16 00:00:00	2026-08-16 23:59:59	BORRADOR	f	0
b73ebad1-13e2-4e38-b297-169f69d61eda	02e6b00c-dd46-44df-bd42-8c38494ab748	circ-01	ACMG 2026 - 8a Fecha	2026-11-29 00:00:00	2026-11-29 23:59:59	BORRADOR	f	0
12a9ac76-c4fd-4d14-b8f9-69ca7daded80	3c3af9e2-522d-4264-bddc-2f3d1a764e6c	circ-01	COPA YAMAHA 2026 - 8a Fecha	2026-10-18 00:00:00	2026-10-18 23:59:59	BORRADOR	f	0
\.


--
-- Data for Name: documentos_evento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documentos_evento (id, evento_id, nombre, archivo_url, es_obligatorio) FROM stdin;
\.


--
-- Data for Name: marcas_motos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.marcas_motos (id, nombre) FROM stdin;
marca-01	Yamaha
marca-02	Honda
marca-03	Kawasaki
marca-04	Suzuki
marca-05	KTM
099a830c-cd1f-4459-a8af-fc332338eb10	Harley Davidson
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, email, password, nombre, apellido, esta_activo, ultimo_login, fecha_creacion, fecha_cambio_pw) FROM stdin;
pil-u-01	pedro.garcia@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Pedro	García	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-02	juan.herrera@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Juan	Herrera	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-03	luis.martinez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Luis	Martínez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-04	andres.lopez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Andrés	López	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-05	diego.ramos@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Diego	Ramos	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-06	carlos.perez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Carlos	Pérez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-07	fernando.cruz@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Fernando	Cruz	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-08	miguel.torres@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Miguel	Torres	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-09	jose.vasquez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	José	Vásquez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-10	alejandro.ruiz@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Alejandro	Ruiz	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-11	mario.castillo@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Mario	Castillo	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-12	rodrigo.morales@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Rodrigo	Morales	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-13	pablo.jimenez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Pablo	Jiménez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-14	oscar.mendez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Oscar	Méndez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-15	victor.reyes@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Víctor	Reyes	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-16	hector.aguilar@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Héctor	Aguilar	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-17	kimberly.ramirez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Kimberly	Ramírez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-18	raul.gonzalez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Raúl	González	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-19	sergio.ramirez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Sergio	Ramírez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-20	maria.arevalo@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Maria Jose	Arévalo	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
usr-admin	admin@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	Carlos	Mendoza	t	2026-08-19 14:59:37.377	2026-05-20 23:39:06.873	2026-08-19 14:59:37.397
f98c3274-9c2b-479c-90eb-285b20855d2d	e2e.test@example.com	$2b$10$5yHvH2nS3DTbZH5cq8aCY.v7MuggALbXhWmOqBgemIG83o.5fLOI2	E2E	Test	f	\N	2026-08-19 14:59:49.827	2026-08-19 15:00:25.679
e2661597-9c39-4bc8-a7e5-7928bb0b6e11	e2e.test2@example.com	$2b$10$9EmMpJxGY0htFQjghA9AcO8PIcbCFPZHJhfOA7EYtxpXhGM1lh0CW	E2E2	Test	f	\N	2026-08-19 15:00:32.234	2026-08-19 15:00:32.416
25332652-7bdf-4697-a2b0-c1813d002760	sandratorres@gmail.com	$2b$10$VMzYaEQCPoXxVsTrnrhBJutFA3pKzd56kFNYRMACuRUkD2LZspBom	SANDRA	TORRES	t	2026-09-21 04:18:51.019	2026-09-04 19:46:41.406	2026-09-21 04:18:51.035
bf0be7bc-3cc0-4e64-8e01-672861fa6d52	staff@mwt.gt	$2b$10$muf.LQLl9purgtOCvPiNge5PIshUY1zN2AEkQ7h4R4lsKo/ZdWKfa	Staff	Tecnico	t	2026-09-07 01:15:52.696	2026-08-30 23:42:59.729	2026-09-07 01:15:52.698
bf0fdaf8-ea11-4f38-bdbf-8ba56154831c	mceballos@gmail.com	$2b$10$Cug81kM6Aga4JAxjXY2.SesTJgDWxQFvrMZX02QtNHEBe7YU.XvNy	Michael	Ceballos	t	\N	2026-05-23 02:20:44.869	2026-05-23 02:20:44.87
ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a	gaparicio@gmail.com	$2b$10$l76Bn0ypgxZ1Wl7DBjjmDO6KIIWNjhKRuF5c.JpNDjZKSz0yCNbSe	Gabriel	Aparicio	f	\N	2026-07-27 14:09:22.447	2026-07-27 14:09:52.744
acd4423a-028f-4643-a9d2-e85028d41c8a	jhgasasasa@gmail.com	$2b$10$i.CyqAGm82DN9U4MkFvnLenavLXGVb0F7ZZfT1UE3ydAOgvx28Jj6	AGUSTIN	RODRIGUEZ	t	\N	2026-07-27 16:15:21.514	2026-07-27 16:15:21.516
4932b935-1bbd-4bae-8bc1-b29d02fe63ef	dfigueroa@gmail.com	$2b$10$cLieTVal4zjHkPKQ2G3eMu.X176b6j7h8zPPHwSKuw.1PL90wu9J.	DANIEL	FIGUEROA	t	\N	2026-08-03 13:58:28.11	2026-08-03 13:58:28.111
usr-staff	recepcion@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	María	López	t	\N	2026-05-20 23:39:06.873	2026-08-19 14:59:34.034
29bd2f86-00b8-4aef-8b4a-8a21e2092fcd	testpiloto2@mwt.gt	$2b$10$jaSciNsDV3ZxZ7.fFsRMWuLFQBIA1gwJ1A4v362/2VU0HfJIPEvgy	Test2	Piloto	f	2026-08-31 00:08:32.079	2026-08-31 00:08:20.737	2026-08-31 00:09:16.272
usr-comis	comisario@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	Roberto	Juárez	t	\N	2026-05-20 23:39:06.873	2026-08-19 14:59:34.034
usr-juez	cronometro@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	Andrea	Castillo	t	\N	2026-05-20 23:39:06.873	2026-08-19 14:59:34.034
e820e718-62a1-467f-a504-62753cd16e31	juez@mwt.gt	$2b$10$muf.LQLl9purgtOCvPiNge5PIshUY1zN2AEkQ7h4R4lsKo/ZdWKfa	Juez	Mesa	t	2026-08-30 23:47:05.984	2026-08-30 23:42:59.721	2026-08-30 23:47:05.986
928464d6-00f5-41b6-9e72-ea1e5d506e66	nuevostaff@mwt.gt	$2b$10$94SC66hGv6gCIMmcGAWaLuawz0EYRi4Wsyu91L9zLqZhxvdIWR3pq	NuevoStaff	Equipo	f	\N	2026-08-31 00:08:38.799	2026-08-31 00:09:16.264
7934425f-13dd-406d-bb8e-d6a292f5ed74	gbarrientosg1@miumg.edu.gt	$2b$10$N/gszA5lpWzlxEc6tGcyBujn0AthipGJodO5ppbrSkv6SNp4OuAii	Gustavo	Barrientos	t	2026-08-30 23:54:28.87	2026-05-21 18:20:25.608	2026-08-30 23:54:28.873
235f2006-67c6-4d50-9e15-4f4d094e6827	testpiloto@mwt.gt	$2b$10$F/.NgpoYFn8DxWM0ItVPCOCN0k3s5KJ6PPMcIaunARsCc7VQdxL5e	Test	Piloto	f	\N	2026-08-31 00:07:56.086	2026-08-31 00:09:16.279
188dcded-0eae-48e5-b93b-b085b4313f71	arielg@gmail.com	$2b$10$6zGyhRVhCHygYdNUAKyKUuXRAOHTKE0CTguWpZj67WJMHiZZ5pMC6	Ariel	Garcia	t	2026-08-31 00:16:25.855	2026-08-31 00:14:19.609	2026-08-31 00:17:28.469
181ec4be-9969-4f83-9e9b-096672d2b86f	susanm@gmail.com	$2b$10$QrvgwCTR0s8miPGn85DXzOplpmqwZa7hc85FL2VKawYl9JvX8HPTG	SUSAN	MARROQUIN	t	\N	2026-08-31 01:48:06.367	2026-08-31 01:48:06.369
6a461f7e-873d-46c1-8965-85dd7aa479ab	comisario@mwt.gt	$2b$10$Hlvma6zSclAEJj.Ts7l9G.3AQN1WroDTk/GQMhINq14cBISTfryrC	Comisario	MWT	t	2026-09-21 04:20:02.493	2026-08-30 23:42:59.714	2026-09-21 04:20:02.496
cc3a6098-e94f-41b3-8dc6-cb82ada812c8	admin@mwt.gt	$2b$10$XviDiaNFeoSdoZGcmEGlqOjNw7qqR/sHKMGoclaGW6iOmisb.kvUO	Admin	MWT	t	2026-10-29 01:24:38.689	2026-08-30 23:42:59.642	2026-10-29 01:24:38.702
b5f6e13b-8c29-4fa8-83ef-d61242f2f34f	piloto@mwt.gt	$2b$10$muf.LQLl9purgtOCvPiNge5PIshUY1zN2AEkQ7h4R4lsKo/ZdWKfa	Piloto	Demo	t	2026-09-07 01:00:06.4	2026-08-30 23:42:59.733	2026-09-07 01:00:06.407
e9f80104-d0a1-4e14-86df-f14e05169de3	abc@gmail.com	$2b$10$KWWVIMrVVmoOJjv49/jOf.60HCS4cUv6jVTzs51fHgdlnygpE90YK	WILL	TERCERO	t	2026-09-07 01:48:25.545	2026-09-07 01:35:34.563	2026-09-07 01:48:25.547
7e7393a0-d67c-4c19-bed2-d9fbb25fa4ae	sara@gmail.com	$2b$10$Gn4mBqfhMSI3QLcezNEGNu4a1asCs8IXPVR9w5t/A9FbaQbgtq/ZC	Sarai	Bonilla	t	2026-09-09 14:43:14.935	2026-09-09 14:43:04.455	2026-09-09 14:43:14.938
49de7aea-1e5d-44d2-a9ad-677baa3522d1	Saraimon@gmail.com	$2b$10$y5xuaxJvLlD8Our0Ll9YDetN.21N23Xcp7rDq2WQ8y3jBmOdZcX7m	Sarai	Montufar	t	\N	2026-09-13 23:37:43.727	2026-09-13 23:37:43.727
5d9b01db-de71-488a-a175-34a316adbfe4	gbarris@miumg.edu.gt	$2b$10$6pmZLQw0IRM/8F1xLnd.zuV5.WeCQjqvdTTrdWsPPuJqzLSCM/v.m	GUSTAVO	GARCIA	t	2026-09-14 03:45:24.217	2026-05-21 19:44:37.055	2026-09-14 03:45:24.219
aa3a3fb0-cb7a-457e-a43e-612e3e62b729	lilia@gmail.com	$2b$10$ZLe5gB310JcdknJ0Pry5/OA./ozcT58gcIvQ0VsOHRyrJv3JHstAe	LILIA	BELTRAN	t	2026-09-14 03:45:45.876	2026-09-13 23:23:25.765	2026-09-14 03:45:45.877
99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16	xiomara@gmail.com	$2b$10$zuMHBUd9uxWclY9kopTq1Ouuz/oSJEEH0uqjx25Cr7X00Ih7.4B5q	Xiomara	Enriquez	t	\N	2026-09-14 03:48:44.972	2026-09-14 03:48:44.976
00c5945d-ae51-49bc-a585-0c792b2a45e6	jose@gmail.com	$2b$10$kKV2z7CVec6WQiLbUz5uMetr/8oN.VzbRWwDQ/VL/OJzqddpS2CIm	Jose	Herrera	t	2026-09-14 17:21:29.547	2026-09-14 17:21:20.531	2026-09-14 17:21:29.549
5c2ed4c6-8769-4699-91bf-bc61150d0f37	saravin@yahooo.com	$2b$10$NqgsnJi3VGO3YAPs0lKHZuupELEa6y1.gGrF90NrurXtUiuvj/HFm	Jeffry	Urbina	t	2026-09-16 02:34:30.497	2026-09-16 02:24:38.633	2026-09-16 02:34:30.5
20d6e041-9399-4373-874b-af6922811bf7	dani@gmail.com	$2b$10$0cIcn70v2KRLZ8uWMLyhHu/nSFSZO2LujGzVjfQOTUFqL/XMRSb8W	Daniel	Figueroa	t	2026-09-14 17:20:47.473	2026-09-14 17:19:48.981	2026-09-16 02:46:25.127
85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b	jfigueroah4@miug.edu.gt	$2b$10$hcrXUt5lMOSI1Kq6GUTT4..EsjHZ4Y1JFwfE1OTykXI8fS/bGIHNq	Jorge Arturo	Figueroa Miranda	t	2026-09-16 18:05:44.223	2026-09-16 02:38:24.837	2026-09-16 18:05:44.225
f4276a72-1138-49f1-b210-bd46d1484d57	jurbinas@miumg.edu.gt	$2b$10$8vkD4Osx9E3C83slQS4zY.x7FmWaF8jOd.48m8xhpF9s4fG9BpZ7K	JEFFRY	SARAVIA	t	\N	2026-09-22 03:37:26.786	2026-09-22 03:37:26.788
aafb5462-269d-47a8-8319-dab9c71a9f75	franc@gmail.com	$2b$10$gYkEki1t/zomnUpIv2GbruvSYF6OuGK3rVTMPQDunG9mHwrQkAE0S	Francisco	ZuÑIga	t	\N	2026-09-28 01:45:35.804	2026-09-28 01:45:35.804
\.


--
-- Data for Name: perfiles_pilotos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.perfiles_pilotos (id, usuario_id, dorsal_preferido, tipo_sangre, alergias, condiciones_medicas, nombre_contacto_emergencia, parentesco_emergencia, telefono_emergencia, seguro_medico_empresa, poliza_seguro, licencia_federacion) FROM stdin;
pil-01	pil-u-01	7	O+	\N	\N	Ana García	Esposa	50991001	Seguros Universales	\N	LIC-GT-001
pil-02	pil-u-02	12	A+	\N	\N	Rosa Herrera	Madre	50991002	G&T Seguros	\N	LIC-GT-002
pil-03	pil-u-03	23	B+	\N	\N	Elena Martínez	Madre	50991003	Seguros Universales	\N	LIC-GT-003
pil-04	pil-u-04	45	AB+	\N	\N	Carmen López	Esposa	50991004	Mapfre Guatemala	\N	LIC-GT-004
pil-05	pil-u-05	3	O-	\N	\N	Patricia Ramos	Madre	50991005	G&T Seguros	\N	LIC-GT-005
pil-06	pil-u-06	18	A-	\N	\N	Jorge Pérez	Hermano	50991006	Seguros Universales	\N	LIC-GT-006
pil-07	pil-u-07	33	O+	\N	\N	Silvia Cruz	Esposa	50991007	Mapfre Guatemala	\N	LIC-GT-007
pil-08	pil-u-08	55	A+	\N	\N	Marco Torres	Padre	50991008	G&T Seguros	\N	LIC-GT-008
pil-09	pil-u-09	9	B-	\N	\N	Patricia Vásquez	Esposa	50991009	Seguros Universales	\N	LIC-GT-009
pil-10	pil-u-10	77	O+	\N	\N	Claudia Ruiz	Hermana	50991010	G&T Seguros	\N	LIC-GT-010
pil-11	pil-u-11	11	A+	\N	\N	Diana Castillo	Madre	50991011	Mapfre Guatemala	\N	LIC-GT-011
pil-12	pil-u-12	27	O+	\N	\N	Luisa Morales	Madre	50991012	Seguros Universales	\N	LIC-GT-012
pil-13	pil-u-13	44	AB-	\N	\N	Marcos Jiménez	Padre	50991013	G&T Seguros	\N	LIC-GT-013
pil-14	pil-u-14	66	B+	\N	\N	Irma Méndez	Esposa	50991014	Mapfre Guatemala	\N	LIC-GT-014
pil-15	pil-u-15	88	A+	\N	\N	Rebeca Reyes	Madre	50991015	Seguros Universales	\N	LIC-GT-015
pil-16	pil-u-16	22	O-	\N	\N	Tomás Aguilar	Hermano	50991016	G&T Seguros	\N	LIC-GT-016
pil-17	pil-u-17	32	A-	\N	\N	Gloria Ramírez	Madre	50991017	Mapfre Guatemala	\N	LIC-GT-017
pil-18	pil-u-18	14	O+	\N	\N	Elena González	Esposa	50991018	Seguros Universales	\N	LIC-GT-018
pil-19	pil-u-19	37	B+	\N	\N	Nora Ramírez	Madre	50991019	G&T Seguros	\N	LIC-GT-019
pil-20	pil-u-20	10	A+	\N	\N	José Arévalo	Padre	50991020	Mapfre Guatemala	\N	LIC-GT-020
2b319405-4f68-4784-902b-b934bb9a6ec8	5d9b01db-de71-488a-a175-34a316adbfe4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0594deec-173b-4877-a8b0-d3049ccdc238	bf0fdaf8-ea11-4f38-bdbf-8ba56154831c	4	\N	\N	\N	\N	\N	\N	\N	\N	\N
fa2bca6d-6d7e-439b-afa7-d4b0887c8966	ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a	61	\N	\N	\N	\N	\N	\N	\N	\N	\N
63391a52-f03b-4d88-b507-1ddfb875b804	acd4423a-028f-4643-a9d2-e85028d41c8a	15	\N	\N	\N	\N	\N	\N	\N	\N	\N
150f33b7-e4d5-41b4-855e-fc347ce3e65b	4932b935-1bbd-4bae-8bc1-b29d02fe63ef	11	\N	\N	\N	\N	\N	\N	\N	\N	\N
8c9deeb2-4d54-45b7-8d98-6a5a4186246c	f98c3274-9c2b-479c-90eb-285b20855d2d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1e0b28f5-451a-4797-9c43-c8a9ec330203	e2661597-9c39-4bc8-a7e5-7928bb0b6e11	77	\N	\N	\N	\N	\N	\N	\N	\N	\N
c56091ca-6eaf-48e6-aa06-796f5ffbd8f0	29bd2f86-00b8-4aef-8b4a-8a21e2092fcd	42	A+	Polen	\N	Maria Piloto	\N	5551234	\N	\N	\N
64d44479-1744-4d18-8330-8d37b0e93b52	188dcded-0eae-48e5-b93b-b085b4313f71	1	AB+	\N	\N	\N	\N	\N	\N	\N	\N
64f057d8-6294-4f8e-8628-63f35d5d829a	181ec4be-9969-4f83-9e9b-096672d2b86f	11	\N	\N	\N	\N	\N	\N	\N	\N	\N
9236a165-b669-4aac-85cf-2da4cc0020c1	25332652-7bdf-4697-a2b0-c1813d002760	17	\N	\N	\N	\N	\N	\N	\N	\N	\N
3fd3fd2b-fcba-4a4b-adc8-2b288fedb364	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	1	O+	Polvo, maní	Ninguna	Luis	\N	+50245454545	\N	\N	4534543543543
82f3c7c5-fd71-4633-8e42-024b0a159e7b	e9f80104-d0a1-4e14-86df-f14e05169de3	12	\N	\N	\N	\N	\N	\N	\N	\N	\N
adcaebdc-330f-4dd6-bee6-6352034a7fe1	7e7393a0-d67c-4c19-bed2-d9fbb25fa4ae	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ad5a8484-4423-4523-aba5-da970c1aded5	aa3a3fb0-cb7a-457e-a43e-612e3e62b729	16	\N	\N	\N	\N	\N	\N	\N	\N	\N
122b6d56-a969-4605-ba2c-57e4c7ecf7bb	49de7aea-1e5d-44d2-a9ad-677baa3522d1	\N	A+	\N	\N	\N	\N	+502	\N	\N	\N
8a1739f2-9806-42fe-b4ef-a645205b7a8a	99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16	\N	O+	\N	\N	\N	\N	+502	\N	\N	\N
6623e7c0-b367-475b-a4a0-56b03076b8d5	20d6e041-9399-4373-874b-af6922811bf7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1a852242-59f8-4aca-9a38-9d70a761687c	00c5945d-ae51-49bc-a585-0c792b2a45e6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
82f8ae7a-fa73-4b0a-9313-f001a94ae9cf	5c2ed4c6-8769-4699-91bf-bc61150d0f37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
71333994-3c83-4fe6-b023-cde1eebd086b	85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b	\N	A+	ninguna.	\N	Maria Jose 45454545	\N	+50256252922	\N	\N	\N
333bc2e5-cced-42b4-a09c-017382cee1b2	f4276a72-1138-49f1-b210-bd46d1484d57	\N	B+	\N	\N	\N	\N	+502	\N	\N	\N
386da8a0-101c-4ccf-ba27-a9d60107a2fa	aafb5462-269d-47a8-8319-dab9c71a9f75	\N	B-	\N	\N	\N	\N	+502	\N	\N	\N
\.


--
-- Data for Name: motocicletas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.motocicletas (id, piloto_id, marca_id, modelo, anio, cilindrada_real, vin, color, apodo_moto) FROM stdin;
moto-01	pil-01	marca-02	CRF125F	2022	125	VIN-001-A	Rojo	El Rojo
moto-02	pil-02	marca-01	YZ125	2023	125	VIN-002-A	Azul	Yamahita
moto-03	pil-03	marca-02	CRF125F	2021	125	VIN-003-A	Negro	La Negra
moto-04	pil-04	marca-01	YZ125	2022	125	VIN-004-A	Blanco	Paloma
moto-05	pil-05	marca-02	CB125R	2023	125	VIN-005-A	Verde	La Verde
moto-06	pil-06	marca-02	CB160R	2023	160	VIN-006-A	Rojo	La Bala
moto-07	pil-07	marca-01	YBR160	2022	160	VIN-007-A	Azul	El Torpedo
moto-08	pil-08	marca-04	GS160R	2022	160	VIN-008-A	Negro	Sombra
moto-09	pil-09	marca-02	CBR160R	2023	160	VIN-009-A	Naranja	Fuego
moto-10	pil-10	marca-01	YZF-R15	2023	155	VIN-010-A	Azul	El Rayo
moto-11	pil-11	marca-02	CB160R	2023	160	VIN-011-A	Blanco	La Paloma
moto-12	pil-12	marca-03	Z160	2022	160	VIN-012-A	Verde	La Bestia
moto-13	pil-13	marca-02	CB200R	2022	200	VIN-013-A	Gris	El Gris
moto-14	pil-14	marca-01	YBR200	2023	200	VIN-014-A	Rojo	El Toro
moto-15	pil-15	marca-04	GW200	2022	200	VIN-015-A	Negro	El Ninja
moto-16	pil-16	marca-01	YZF-R3	2023	321	VIN-016-A	Azul	R3 King
moto-17	pil-17	marca-01	YZF-R3	2022	321	VIN-017-A	Negro	Dark R3
moto-18	pil-18	marca-03	Z400	2023	399	VIN-018-A	Verde	La Bestia
moto-19	pil-19	marca-01	YZF-R3	2023	321	VIN-019-A	Rojo	Diablo
moto-20	pil-20	marca-01	YZF-R3	2023	321	VIN-020-A	Azul	R3 Queen
moto-21	pil-16	marca-02	CBR600RR	2022	599	VIN-021-A	Rojo	Cohete
moto-22	pil-17	marca-01	YZF-R6	2023	599	VIN-022-A	Azul	El Avión
moto-23	pil-18	marca-03	ZX-6R	2022	636	VIN-023-A	Verde	Rana
moto-24	pil-19	marca-04	GSX-R600	2021	599	VIN-024-A	Azul	El Relámpago
moto-25	pil-20	marca-02	CBR600RR	2022	599	VIN-025-A	Negro	La Pantera
84d6665b-a618-4a94-b232-cf11a4d263aa	2b319405-4f68-4784-902b-b934bb9a6ec8	marca-01	RT-200	2015	120	\N	\N	\N
bc8774c6-4575-429e-b8c3-ee9722eb5d83	2b319405-4f68-4784-902b-b934bb9a6ec8	marca-02	Wachiwa	2021	125	\N	\N	Wachi
db9e8ed3-bc8b-4d44-b063-af0858b97a4c	pil-09	marca-02	Hola200	2026	125	\N	\N	\N
f7578b06-92a9-4e88-a909-1c1910c12e06	pil-19	marca-03	rt-125	2015	125	\N	\N	\N
de19de9a-c731-4e99-9885-e07504a41696	pil-19	marca-03	rt-125	2015	125	\N	\N	\N
9548c928-c44f-459b-83a6-f86ee9d20869	pil-07	marca-03	CRB 200cc	2015	200	\N	\N	\N
d9a713b4-6edb-49ca-861a-adf44c7c43b6	pil-08	marca-04	CBS 200cc	2017	200	\N	\N	\N
bf7f41d7-52b8-472a-ab56-0c5dbf8296b0	pil-19	marca-02	Wachi160cc	2016	160	\N	\N	\N
777c3e9e-9708-4da2-8d50-f2794028f57d	pil-10	marca-02	CBR200cc	2013	200	\N	\N	\N
99e0c42d-e277-436e-b0d5-f00d3aa4d920	0594deec-173b-4877-a8b0-d3049ccdc238	marca-05	ABC200cc	2017	200	\N	\N	\N
550d6f9b-796a-42f4-87dc-653366da2d94	0594deec-173b-4877-a8b0-d3049ccdc238	marca-04	CBR600cc	2018	600	\N	\N	\N
de4f753e-d637-4622-a2bc-5c6268fa07fe	150f33b7-e4d5-41b4-855e-fc347ce3e65b	marca-02	XRZ3	2026	300	12334	\N	\N
59677147-fc21-458e-b94d-4c5735fc0af6	64f057d8-6294-4f8e-8628-63f35d5d829a	marca-01	GTR600cc	2026	600	\N	\N	\N
05eb0590-a427-4dab-85fb-d5e5ebc34c62	64f057d8-6294-4f8e-8628-63f35d5d829a	marca-01	ERP160c	2025	155	\N	\N	\N
3e8ecb31-4a94-496a-8217-d0ed6eb6ffe5	2b319405-4f68-4784-902b-b934bb9a6ec8	marca-02	EZR2	2026	220	123	\N	\N
4b5688b0-646d-4af7-8f57-7b556ae98710	2b319405-4f68-4784-902b-b934bb9a6ec8	marca-03	ZBR2	2024	200	\N	\N	\N
d6a78811-7c6e-4a8d-bd12-7200da7d82cd	63391a52-f03b-4d88-b507-1ddfb875b804	marca-03	youki125	2005	125	\N	\N	\N
d42b4121-58da-4bdf-8697-13a25a8024af	63391a52-f03b-4d88-b507-1ddfb875b804	099a830c-cd1f-4459-a8af-fc332338eb10	Super300	2026	300	\N	\N	ApacheDeFuego
8f5b375a-8256-448d-bf53-8758aad6c69d	82f3c7c5-fd71-4633-8e42-024b0a159e7b	marca-05	Duck300	2010	300	\N	\N	Duki
221267d7-ae06-41d6-8a4f-ae67d060ee8f	82f3c7c5-fd71-4633-8e42-024b0a159e7b	099a830c-cd1f-4459-a8af-fc332338eb10	Supra	2019	200	\N	\N	Saiko
853e81b6-e8fd-417d-86ff-82459ee15637	8a1739f2-9806-42fe-b4ef-a645205b7a8a	marca-04	125JR	2018	125	\N	\N	lachio
439a4a31-2e93-4b39-89e1-7332b5c81cdd	8a1739f2-9806-42fe-b4ef-a645205b7a8a	marca-05	600FR	2017	600	\N	\N	grandota
aa4dc648-6f28-4610-a844-fa7b90e4477c	71333994-3c83-4fe6-b023-cde1eebd086b	marca-01	Jeffry	2022	201	\N	Rojo	Botas Miguelin
e5bdca31-e685-4931-8ad4-a530d444b0df	71333994-3c83-4fe6-b023-cde1eebd086b	099a830c-cd1f-4459-a8af-fc332338eb10	ZKR200	2022	125	\N	\N	\N
8c27daba-6432-483b-bf67-d7665d1e4bb8	9236a165-b669-4aac-85cf-2da4cc0020c1	marca-04	Waz125	2014	125	\N	\N	\N
eaf555c6-6bf1-4e3d-b988-32366ac658f7	64d44479-1744-4d18-8330-8d37b0e93b52	marca-05	ER160	2018	160	\N	\N	Duracell
8db4f53f-8447-42a8-96d0-cd20e298509a	64d44479-1744-4d18-8330-8d37b0e93b52	marca-01	FZ125	2019	125	\N	\N	Fazt
f23e7c6b-9f20-46d3-aaa8-d42859d27eb9	386da8a0-101c-4ccf-ba27-a9d60107a2fa	marca-05	Dir125	2025	125	\N	\N	ElPanchito
41364bfe-58a8-4e3a-97e5-64270c184bee	pil-10	marca-02	Az300	2016	300	\N	\N	\N
b4e0caa8-c981-4c48-9ab1-30d71ce75ea6	pil-10	099a830c-cd1f-4459-a8af-fc332338eb10	125tx	2018	125	\N	\N	\N
cba806b5-7857-455e-a5cb-13d204828efc	pil-10	marca-03	CBR600	2026	600	\N	\N	\N
1ccdf64c-b333-49b3-ba60-43099bf3a4f2	pil-04	marca-04	EXZ160	2021	160	\N	\N	\N
1de7f058-28c0-4547-a3ba-32004943e9ab	63391a52-f03b-4d88-b507-1ddfb875b804	099a830c-cd1f-4459-a8af-fc332338eb10	FZX6	2026	600	\N	\N	\N
\.


--
-- Data for Name: inscripciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscripciones (id, evento_id, piloto_id, categoria_id, motocicleta_id, fecha_registro, estado, dorsal_asignado) FROM stdin;
f231cc42-1887-4ddb-8c37-8b1ad55e9594	632508e2-8a71-4e0c-b32f-b14f7b6e2808	63391a52-f03b-4d88-b507-1ddfb875b804	113f73a2-f375-46b5-92d9-863a23a8aadd	1de7f058-28c0-4547-a3ba-32004943e9ab	2026-10-27 15:54:46.843	PAGADA	3
789e89c4-689a-4dec-b107-51c7e07ed00c	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	d104985a-d337-4c13-8d8d-b20a4fa98be0	cba806b5-7857-455e-a5cb-13d204828efc	2026-10-27 17:30:26.113	PAGADA	3
36ad996e-c5a2-45ac-99b1-048e3d460d79	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-06	d29fcc5e-4618-482f-b745-d76255c17475	\N	2026-10-29 01:27:32.224	VALIDADA	10
6105d65e-93a1-4c7e-951f-5ad526405f58	632508e2-8a71-4e0c-b32f-b14f7b6e2808	63391a52-f03b-4d88-b507-1ddfb875b804	8e14eecf-e596-4e48-a6ec-625f4d67fe26	d6a78811-7c6e-4a8d-bd12-7200da7d82cd	2026-10-26 01:39:42.827	PAGADA	1
f18a2abe-e669-4424-9dee-6ee2ed3d9964	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-04	8e14eecf-e596-4e48-a6ec-625f4d67fe26	moto-04	2026-10-26 02:04:16.849	PAGADA	2
a8e124d4-92fb-41cc-8daa-bc66d0f5bbf9	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	8e14eecf-e596-4e48-a6ec-625f4d67fe26	b4e0caa8-c981-4c48-9ab1-30d71ce75ea6	2026-10-26 02:04:50.523	VALIDADA	3
168a3429-9fc9-437b-b8c1-3e7a5d4b3ec9	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-01	8e14eecf-e596-4e48-a6ec-625f4d67fe26	moto-01	2026-10-26 02:08:55.308	PAGADA	7
4fe00ea5-0615-497f-8915-25d2aa60b01a	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-02	8e14eecf-e596-4e48-a6ec-625f4d67fe26	moto-02	2026-10-26 02:08:55.308	PAGADA	12
d69977d9-6c22-4f36-8816-b47fda58546a	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-03	8e14eecf-e596-4e48-a6ec-625f4d67fe26	moto-03	2026-10-26 02:08:55.308	PAGADA	23
bb8ce079-2d57-4926-b9df-296e4b033132	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-05	8e14eecf-e596-4e48-a6ec-625f4d67fe26	moto-05	2026-10-26 02:08:55.308	VALIDADA	4
322d4ce6-1572-498b-b773-f798f159b25d	632508e2-8a71-4e0c-b32f-b14f7b6e2808	2b319405-4f68-4784-902b-b934bb9a6ec8	8e14eecf-e596-4e48-a6ec-625f4d67fe26	84d6665b-a618-4a94-b232-cf11a4d263aa	2026-10-26 02:08:55.308	PENDIENTE	24
7005a1fb-dbe6-4227-b06a-a92da3ff5387	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-09	8e14eecf-e596-4e48-a6ec-625f4d67fe26	db9e8ed3-bc8b-4d44-b063-af0858b97a4c	2026-10-26 02:08:55.308	PAGADA	9
be489eb6-5ed0-4ab1-9ec2-90f2a56f38ff	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-19	8e14eecf-e596-4e48-a6ec-625f4d67fe26	f7578b06-92a9-4e88-a909-1c1910c12e06	2026-10-26 02:08:55.309	PAGADA	37
6efe4c44-534c-43a8-a829-cc8a622a4650	632508e2-8a71-4e0c-b32f-b14f7b6e2808	8a1739f2-9806-42fe-b4ef-a645205b7a8a	8e14eecf-e596-4e48-a6ec-625f4d67fe26	853e81b6-e8fd-417d-86ff-82459ee15637	2026-10-26 02:08:55.309	PAGADA	38
4b87c0b2-852c-4d04-9320-0ca2bb05fdc8	632508e2-8a71-4e0c-b32f-b14f7b6e2808	71333994-3c83-4fe6-b023-cde1eebd086b	8e14eecf-e596-4e48-a6ec-625f4d67fe26	e5bdca31-e685-4931-8ad4-a530d444b0df	2026-10-26 02:08:55.309	VALIDADA	39
0eb39e7f-7930-4888-8af6-b9475d3398a7	632508e2-8a71-4e0c-b32f-b14f7b6e2808	9236a165-b669-4aac-85cf-2da4cc0020c1	8e14eecf-e596-4e48-a6ec-625f4d67fe26	8c27daba-6432-483b-bf67-d7665d1e4bb8	2026-10-26 02:08:55.309	PENDIENTE	17
bd9bd057-48aa-4391-8180-e928c78525f0	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64d44479-1744-4d18-8330-8d37b0e93b52	8e14eecf-e596-4e48-a6ec-625f4d67fe26	8db4f53f-8447-42a8-96d0-cd20e298509a	2026-10-26 02:08:55.309	PAGADA	5
76a6ff37-a94d-40f7-a4f0-7841e28934ea	632508e2-8a71-4e0c-b32f-b14f7b6e2808	386da8a0-101c-4ccf-ba27-a9d60107a2fa	8e14eecf-e596-4e48-a6ec-625f4d67fe26	f23e7c6b-9f20-46d3-aaa8-d42859d27eb9	2026-10-26 02:08:55.309	PAGADA	40
bb71099f-9942-4be5-9165-cb66203ba965	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-06	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-06	2026-10-26 02:08:55.309	PAGADA	18
5b1ba89f-6c66-4d32-a7df-f8b36d793137	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-07	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-07	2026-10-26 02:08:55.309	VALIDADA	33
e682cebc-d58e-4d77-b861-da9bdee9aa58	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-08	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-08	2026-10-26 02:08:55.309	PENDIENTE	55
c76158a6-76ea-4520-8e2c-7d929c009bd3	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-09	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-09	2026-10-26 02:08:55.309	PAGADA	9
9e6da6b8-660d-4ebc-9db6-76848886a667	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-10	2026-10-26 02:08:55.309	PAGADA	77
9038f4f0-129e-44da-b8a2-97df113481ec	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-11	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-11	2026-10-26 02:08:55.309	PAGADA	11
f558b698-c8cc-4e18-ae2b-012d88ec177e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-12	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-12	2026-10-26 02:08:55.309	VALIDADA	27
31370c4f-2bec-4fe1-8f72-696e23a1d3d8	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-19	45e9d91c-f550-469b-a342-0dd5fdd63f0c	bf7f41d7-52b8-472a-ab56-0c5dbf8296b0	2026-10-26 02:08:55.309	PENDIENTE	37
a82215f8-f2ad-4409-845a-18ad553cd3ab	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64f057d8-6294-4f8e-8628-63f35d5d829a	45e9d91c-f550-469b-a342-0dd5fdd63f0c	05eb0590-a427-4dab-85fb-d5e5ebc34c62	2026-10-26 02:08:55.309	PAGADA	12
7de4b2b7-62a5-4f55-adba-e9d359621d70	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64d44479-1744-4d18-8330-8d37b0e93b52	45e9d91c-f550-469b-a342-0dd5fdd63f0c	eaf555c6-6bf1-4e3d-b988-32366ac658f7	2026-10-26 02:08:55.309	PAGADA	1
544b80b8-f72b-46be-8f31-cba1f3d3f59e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	122b6d56-a969-4605-ba2c-57e4c7ecf7bb	45e9d91c-f550-469b-a342-0dd5fdd63f0c	moto-10	2026-10-26 02:10:28.374	VALIDADA	78
5ea2676c-89e7-49ca-8e1a-a20f66149a3f	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-06	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-06	2026-10-26 02:08:55.309	PAGADA	18
f1ef240b-4afe-401f-8ff4-6a8c27f25bff	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-07	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-07	2026-10-26 02:08:55.309	VALIDADA	33
40d7a101-88b4-4acd-b94c-3f0577e622c5	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-08	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-08	2026-10-26 02:08:55.309	PENDIENTE	55
85f4dc93-1094-4918-b479-968b98b46188	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-09	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-09	2026-10-26 02:08:55.309	PAGADA	9
34a7d522-891e-4a15-8b7d-7266cbd2575c	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-10	2026-10-26 02:08:55.309	PAGADA	77
bc0a64c9-c658-4334-bc55-12ea3220c72b	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-11	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-11	2026-10-26 02:08:55.309	PAGADA	11
0d656014-a921-4b3d-b8bb-b38fd05412e6	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-12	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-12	2026-10-26 02:08:55.309	VALIDADA	27
f7a86a3b-8831-42ee-9141-e4260e2cec90	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-19	2b195287-2fc7-4622-bec8-8f7b305454d7	bf7f41d7-52b8-472a-ab56-0c5dbf8296b0	2026-10-26 02:08:55.309	PENDIENTE	37
6ed30303-1646-46ee-b876-e4022759e5f4	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64f057d8-6294-4f8e-8628-63f35d5d829a	2b195287-2fc7-4622-bec8-8f7b305454d7	05eb0590-a427-4dab-85fb-d5e5ebc34c62	2026-10-26 02:08:55.309	PAGADA	12
4a17d079-a8fd-4991-8c16-387787bab954	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64d44479-1744-4d18-8330-8d37b0e93b52	2b195287-2fc7-4622-bec8-8f7b305454d7	eaf555c6-6bf1-4e3d-b988-32366ac658f7	2026-10-26 02:08:55.309	PAGADA	1
2cc5d6ec-05e9-405e-b928-732f2a715c54	632508e2-8a71-4e0c-b32f-b14f7b6e2808	adcaebdc-330f-4dd6-bee6-6352034a7fe1	2b195287-2fc7-4622-bec8-8f7b305454d7	moto-10	2026-10-26 02:10:28.374	PENDIENTE	78
4934a38a-5065-4235-b6c0-8292a0a37b23	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-04	2b195287-2fc7-4622-bec8-8f7b305454d7	1ccdf64c-b333-49b3-ba60-43099bf3a4f2	2026-10-27 15:32:58.531	PAGADA	2
74225b60-27bf-4bc8-8d18-fe891dc8037e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-13	d29fcc5e-4618-482f-b745-d76255c17475	moto-13	2026-10-26 02:08:55.309	PAGADA	44
7ff7ca78-c08a-4d82-bdf7-c54e8f18b64c	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-14	d29fcc5e-4618-482f-b745-d76255c17475	moto-14	2026-10-26 02:08:55.309	VALIDADA	66
2fa70046-9bd9-4f5f-9ce8-df7b63f2b88b	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-15	d29fcc5e-4618-482f-b745-d76255c17475	moto-15	2026-10-26 02:08:55.309	PENDIENTE	88
07ebf7bd-e662-4470-b8b5-b3f18846ca5e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-07	d29fcc5e-4618-482f-b745-d76255c17475	9548c928-c44f-459b-83a6-f86ee9d20869	2026-10-26 02:08:55.309	PAGADA	33
974efda0-2940-4d65-93da-b22329f142f3	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-08	d29fcc5e-4618-482f-b745-d76255c17475	d9a713b4-6edb-49ca-861a-adf44c7c43b6	2026-10-26 02:08:55.309	PAGADA	55
3c7f3e31-b037-4d74-b5ff-1189f53905bf	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	d29fcc5e-4618-482f-b745-d76255c17475	777c3e9e-9708-4da2-8d50-f2794028f57d	2026-10-26 02:08:55.309	PAGADA	77
4f35b15f-981f-4f92-abf3-b66874bf6f91	632508e2-8a71-4e0c-b32f-b14f7b6e2808	0594deec-173b-4877-a8b0-d3049ccdc238	d29fcc5e-4618-482f-b745-d76255c17475	99e0c42d-e277-436e-b0d5-f00d3aa4d920	2026-10-26 02:08:55.309	VALIDADA	4
1b8b088b-0c69-49e4-9d32-72e567a645e0	632508e2-8a71-4e0c-b32f-b14f7b6e2808	2b319405-4f68-4784-902b-b934bb9a6ec8	d29fcc5e-4618-482f-b745-d76255c17475	4b5688b0-646d-4af7-8f57-7b556ae98710	2026-10-26 02:08:55.309	PENDIENTE	89
a25de06b-8fb8-4a1a-ab87-617eeab8e30e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	82f3c7c5-fd71-4633-8e42-024b0a159e7b	d29fcc5e-4618-482f-b745-d76255c17475	221267d7-ae06-41d6-8a4f-ae67d060ee8f	2026-10-26 02:08:55.309	PAGADA	12
531a03d2-7d24-4984-85c8-83d0038adc02	632508e2-8a71-4e0c-b32f-b14f7b6e2808	1a852242-59f8-4aca-9a38-9d70a761687c	d29fcc5e-4618-482f-b745-d76255c17475	moto-13	2026-10-26 02:10:28.374	PAGADA	90
c64816ca-83d4-4d7e-9503-ca7965b13632	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-13	18d51b3d-99bc-4696-8275-7c8053362ff5	moto-13	2026-10-26 02:08:55.309	PAGADA	44
6ae126a8-582d-4d4a-a518-d216839abfba	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-14	18d51b3d-99bc-4696-8275-7c8053362ff5	moto-14	2026-10-26 02:08:55.309	VALIDADA	66
fb299a2d-3a02-4ab2-8868-5c1cbccbeaf2	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-15	18d51b3d-99bc-4696-8275-7c8053362ff5	moto-15	2026-10-26 02:08:55.309	PENDIENTE	88
89966ed4-b1ef-4986-b33e-38bf299e8b6f	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-07	18d51b3d-99bc-4696-8275-7c8053362ff5	9548c928-c44f-459b-83a6-f86ee9d20869	2026-10-26 02:08:55.309	PAGADA	33
ca50f7b3-46ab-4e07-8187-3e79177bd3e7	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-08	18d51b3d-99bc-4696-8275-7c8053362ff5	d9a713b4-6edb-49ca-861a-adf44c7c43b6	2026-10-26 02:08:55.309	PAGADA	55
f7ccfac1-4cd1-47d3-abab-afac3122e871	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	18d51b3d-99bc-4696-8275-7c8053362ff5	777c3e9e-9708-4da2-8d50-f2794028f57d	2026-10-26 02:08:55.309	PAGADA	77
6e81efd5-f7a7-4474-8f90-1366af0584c0	632508e2-8a71-4e0c-b32f-b14f7b6e2808	0594deec-173b-4877-a8b0-d3049ccdc238	18d51b3d-99bc-4696-8275-7c8053362ff5	99e0c42d-e277-436e-b0d5-f00d3aa4d920	2026-10-26 02:08:55.309	VALIDADA	4
705d5e98-59b9-43e9-9df6-41308385bee6	632508e2-8a71-4e0c-b32f-b14f7b6e2808	2b319405-4f68-4784-902b-b934bb9a6ec8	18d51b3d-99bc-4696-8275-7c8053362ff5	4b5688b0-646d-4af7-8f57-7b556ae98710	2026-10-26 02:08:55.309	PENDIENTE	89
51250210-810b-4328-af59-5248b70b673d	632508e2-8a71-4e0c-b32f-b14f7b6e2808	82f3c7c5-fd71-4633-8e42-024b0a159e7b	18d51b3d-99bc-4696-8275-7c8053362ff5	221267d7-ae06-41d6-8a4f-ae67d060ee8f	2026-10-26 02:08:55.309	PAGADA	12
f088f84e-d103-4b3b-be51-d1328f0190fa	632508e2-8a71-4e0c-b32f-b14f7b6e2808	71333994-3c83-4fe6-b023-cde1eebd086b	18d51b3d-99bc-4696-8275-7c8053362ff5	aa4dc648-6f28-4610-a844-fa7b90e4477c	2026-10-26 02:08:55.309	PAGADA	90
084de629-4ba8-4bb4-93e7-2ccbb155eaff	632508e2-8a71-4e0c-b32f-b14f7b6e2808	ad5a8484-4423-4523-aba5-da970c1aded5	18d51b3d-99bc-4696-8275-7c8053362ff5	moto-13	2026-10-26 02:10:28.374	PAGADA	16
c1d21401-52df-4b86-91a5-e8b3cb44f821	632508e2-8a71-4e0c-b32f-b14f7b6e2808	63391a52-f03b-4d88-b507-1ddfb875b804	d2b40d33-ad83-4360-b050-7186172377ad	d42b4121-58da-4bdf-8697-13a25a8024af	2026-10-26 02:02:21.178	PAGADA	1
6dc7dcac-0e61-4b86-b8f3-bd88402195a4	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	d2b40d33-ad83-4360-b050-7186172377ad	41364bfe-58a8-4e3a-97e5-64270c184bee	2026-10-26 02:03:53.85	PAGADA	2
7ffb45a1-a25d-4f95-8a54-945167fe0eae	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-16	d2b40d33-ad83-4360-b050-7186172377ad	moto-16	2026-10-26 02:08:55.31	PAGADA	22
5ebac4c5-191e-4c08-b782-e7b30ec033fe	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-17	d2b40d33-ad83-4360-b050-7186172377ad	moto-17	2026-10-26 02:08:55.31	PAGADA	32
39c1df02-a5ff-441a-bc63-2a695a641c2b	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-18	d2b40d33-ad83-4360-b050-7186172377ad	moto-18	2026-10-26 02:08:55.31	PAGADA	14
558ef655-edca-467d-b792-80864b1b239b	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-19	d2b40d33-ad83-4360-b050-7186172377ad	moto-19	2026-10-26 02:08:55.31	VALIDADA	37
531853cf-0931-4e61-bb9f-25ccc26be135	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-20	d2b40d33-ad83-4360-b050-7186172377ad	moto-20	2026-10-26 02:08:55.31	PENDIENTE	10
ae730f11-52cd-479f-a538-d3c28fdb5160	632508e2-8a71-4e0c-b32f-b14f7b6e2808	150f33b7-e4d5-41b4-855e-fc347ce3e65b	d2b40d33-ad83-4360-b050-7186172377ad	de4f753e-d637-4622-a2bc-5c6268fa07fe	2026-10-26 02:08:55.31	PAGADA	11
e5c15fb8-c6ab-4d5e-8c73-6672cf53de78	632508e2-8a71-4e0c-b32f-b14f7b6e2808	82f3c7c5-fd71-4633-8e42-024b0a159e7b	d2b40d33-ad83-4360-b050-7186172377ad	8f5b375a-8256-448d-bf53-8758aad6c69d	2026-10-26 02:08:55.31	PAGADA	12
495d4ebb-9b36-41ce-9365-3577ce094c1e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	333bc2e5-cced-42b4-a09c-017382cee1b2	d2b40d33-ad83-4360-b050-7186172377ad	8f5b375a-8256-448d-bf53-8758aad6c69d	2026-10-26 02:10:28.374	PAGADA	38
88b1a372-8651-4dc1-8578-e151b2e715d3	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-16	d104985a-d337-4c13-8d8d-b20a4fa98be0	moto-21	2026-10-26 02:08:55.31	PAGADA	22
1af3c488-48be-4f43-a64a-b7f96054b0b1	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-17	d104985a-d337-4c13-8d8d-b20a4fa98be0	moto-22	2026-10-26 02:08:55.31	VALIDADA	32
03e65d9b-bf3c-4c84-985c-b9210ebf3dd9	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-18	d104985a-d337-4c13-8d8d-b20a4fa98be0	moto-23	2026-10-26 02:08:55.31	PENDIENTE	14
89c04d10-bca7-4518-b56e-d91f1b63b182	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-19	d104985a-d337-4c13-8d8d-b20a4fa98be0	moto-24	2026-10-26 02:08:55.31	PAGADA	37
ac1ca254-10e5-44c6-857e-d12ed6a1bdf4	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-20	d104985a-d337-4c13-8d8d-b20a4fa98be0	moto-25	2026-10-26 02:08:55.31	PAGADA	10
40611517-47d5-4969-8e32-a3d4076e0101	632508e2-8a71-4e0c-b32f-b14f7b6e2808	0594deec-173b-4877-a8b0-d3049ccdc238	d104985a-d337-4c13-8d8d-b20a4fa98be0	550d6f9b-796a-42f4-87dc-653366da2d94	2026-10-26 02:08:55.31	PAGADA	4
c3a3897c-834d-43af-af14-6dde59f6a552	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64f057d8-6294-4f8e-8628-63f35d5d829a	d104985a-d337-4c13-8d8d-b20a4fa98be0	59677147-fc21-458e-b94d-4c5735fc0af6	2026-10-26 02:08:55.31	VALIDADA	11
52e06d1c-c8f1-432a-b5e2-5d8f3ba3d51c	632508e2-8a71-4e0c-b32f-b14f7b6e2808	8a1739f2-9806-42fe-b4ef-a645205b7a8a	d104985a-d337-4c13-8d8d-b20a4fa98be0	439a4a31-2e93-4b39-89e1-7332b5c81cdd	2026-10-26 02:08:55.31	PENDIENTE	38
f7abdaf1-525e-4a3e-b134-917f0bc4aa16	632508e2-8a71-4e0c-b32f-b14f7b6e2808	6623e7c0-b367-475b-a4a0-56b03076b8d5	d104985a-d337-4c13-8d8d-b20a4fa98be0	moto-24	2026-10-26 02:10:28.374	PAGADA	39
80e0b288-2fbf-401d-b2c1-4a11b5d7efef	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-16	113f73a2-f375-46b5-92d9-863a23a8aadd	moto-21	2026-10-26 02:08:55.309	PAGADA	22
4d948b4a-892a-4715-bca3-d27325772d76	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-17	113f73a2-f375-46b5-92d9-863a23a8aadd	moto-22	2026-10-26 02:08:55.309	PAGADA	32
a31479e9-8068-4708-9303-16781947ece7	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-18	113f73a2-f375-46b5-92d9-863a23a8aadd	moto-23	2026-10-26 02:08:55.309	VALIDADA	14
4801e4a8-cc5e-4b62-9172-87697172b465	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-19	113f73a2-f375-46b5-92d9-863a23a8aadd	moto-24	2026-10-26 02:08:55.309	PENDIENTE	37
3b5eade9-1de0-4cb5-91b5-accdb9ff6f3d	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-20	113f73a2-f375-46b5-92d9-863a23a8aadd	moto-25	2026-10-26 02:08:55.309	PAGADA	10
8f971893-d48a-4fb1-bc25-56024775182b	632508e2-8a71-4e0c-b32f-b14f7b6e2808	0594deec-173b-4877-a8b0-d3049ccdc238	113f73a2-f375-46b5-92d9-863a23a8aadd	550d6f9b-796a-42f4-87dc-653366da2d94	2026-10-26 02:08:55.309	PAGADA	4
ef686243-55e1-4f3a-841a-d3339f662085	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64f057d8-6294-4f8e-8628-63f35d5d829a	113f73a2-f375-46b5-92d9-863a23a8aadd	59677147-fc21-458e-b94d-4c5735fc0af6	2026-10-26 02:08:55.309	PAGADA	11
23da9d4f-70c3-442c-81ec-ffd81403693e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	8a1739f2-9806-42fe-b4ef-a645205b7a8a	113f73a2-f375-46b5-92d9-863a23a8aadd	439a4a31-2e93-4b39-89e1-7332b5c81cdd	2026-10-26 02:08:55.309	VALIDADA	38
43c9f149-aad0-4713-bc6c-615592b52860	632508e2-8a71-4e0c-b32f-b14f7b6e2808	fa2bca6d-6d7e-439b-afa7-d4b0887c8966	113f73a2-f375-46b5-92d9-863a23a8aadd	moto-24	2026-10-26 02:10:28.374	VALIDADA	61
ba6c4f8d-ddea-4794-a1c0-eda62beea302	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-16	a25afd04-daaa-41d6-9074-048dba75fc93	moto-21	2026-10-26 02:08:55.309	PENDIENTE	22
5627eaf4-9bb6-4fd5-bb8a-41de3eddb903	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-17	a25afd04-daaa-41d6-9074-048dba75fc93	moto-22	2026-10-26 02:08:55.309	PAGADA	32
4493d767-8cd0-4e4e-9e5e-12b709590ad4	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-18	a25afd04-daaa-41d6-9074-048dba75fc93	moto-23	2026-10-26 02:08:55.31	PAGADA	14
10ddcd5f-1115-4fa9-9b17-277100dc35a4	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-19	a25afd04-daaa-41d6-9074-048dba75fc93	moto-24	2026-10-26 02:08:55.31	PAGADA	37
2620a7f2-5117-4f5b-a0a2-598a3e3f71e9	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-20	a25afd04-daaa-41d6-9074-048dba75fc93	moto-25	2026-10-26 02:08:55.31	VALIDADA	10
9d2a8b5b-bab4-42a9-990e-9f34661b4fc6	632508e2-8a71-4e0c-b32f-b14f7b6e2808	0594deec-173b-4877-a8b0-d3049ccdc238	a25afd04-daaa-41d6-9074-048dba75fc93	550d6f9b-796a-42f4-87dc-653366da2d94	2026-10-26 02:08:55.31	PENDIENTE	4
2f793bcb-8623-487c-9ea3-28665fc9fecb	632508e2-8a71-4e0c-b32f-b14f7b6e2808	64f057d8-6294-4f8e-8628-63f35d5d829a	a25afd04-daaa-41d6-9074-048dba75fc93	59677147-fc21-458e-b94d-4c5735fc0af6	2026-10-26 02:08:55.31	PAGADA	11
da3a2097-3b19-4c6d-bcc6-0c0e797b2175	632508e2-8a71-4e0c-b32f-b14f7b6e2808	8a1739f2-9806-42fe-b4ef-a645205b7a8a	a25afd04-daaa-41d6-9074-048dba75fc93	439a4a31-2e93-4b39-89e1-7332b5c81cdd	2026-10-26 02:08:55.31	PAGADA	38
d18e47a8-9d6d-4bc6-a703-4a35834ec153	632508e2-8a71-4e0c-b32f-b14f7b6e2808	82f8ae7a-fa73-4b0a-9313-f001a94ae9cf	a25afd04-daaa-41d6-9074-048dba75fc93	moto-24	2026-10-26 02:10:28.374	PENDIENTE	39
99dc7db0-798a-42ea-bda5-4366358a3af5	632508e2-8a71-4e0c-b32f-b14f7b6e2808	pil-10	a25afd04-daaa-41d6-9074-048dba75fc93	cba806b5-7857-455e-a5cb-13d204828efc	2026-10-26 03:16:19.282	PAGADA	99
\.


--
-- Data for Name: accesos_documento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accesos_documento (id, documento_id, inscripcion_id, fecha_acceso) FROM stdin;
\.


--
-- Data for Name: actividades_cronograma; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actividades_cronograma (id, evento_id, nombre, hora_inicio, hora_fin, descripcion, es_pista) FROM stdin;
a15fe833-bc97-4cec-8708-e9ba284b5794	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 00:00:00	2026-02-22 00:30:00	125cc Stock	t
7d0041b1-8dbb-45d9-845d-6a0815ba390e	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 00:35:00	2026-02-22 01:05:00	125cc Stock	t
50be16eb-d886-4614-8ae5-8df630189b17	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 01:10:00	2026-02-22 01:40:00	160cc Libre	t
b32f8e40-18db-4b81-a10c-01c8bde17096	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 01:45:00	2026-02-22 02:15:00	160cc Libre	t
fbdf40d4-92d9-49b1-aa09-a96b9b50747f	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 02:20:00	2026-02-22 02:50:00	160cc Stock	t
e53028b4-d4e7-4f28-ae97-247dffe97948	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 02:55:00	2026-02-22 03:25:00	160cc Stock	t
527a0923-709d-4ef3-9a8d-18a09b0ac959	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 03:30:00	2026-02-22 04:00:00	200cc Libre	t
24e96991-2e9d-4218-a5ec-da4cd0067e20	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 04:05:00	2026-02-22 04:35:00	200cc Libre	t
f273101d-f49a-4bd1-a26d-c67c69adc321	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 04:40:00	2026-02-22 05:10:00	200cc Stock	t
f402b1be-2a0f-4966-b87c-a2904dabbd32	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 05:15:00	2026-02-22 05:45:00	200cc Stock	t
c0bd05ea-3dc6-4acc-b5e4-df2d19871203	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 05:50:00	2026-02-22 06:20:00	600cc Avanzados	t
5a8d2fda-4c2d-4509-9afa-2c861a9113dc	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 06:25:00	2026-02-22 06:55:00	600cc Avanzados	t
a21c7d9a-0e92-475c-9aaa-06615a4c756a	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 07:00:00	2026-02-22 07:30:00	600cc PRO (Expertos)	t
d0322484-b2d0-4599-bd8b-3abb12f3c4d4	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 07:35:00	2026-02-22 08:05:00	600cc PRO (Expertos)	t
7319b3aa-e9ac-4e1f-873e-b09f9e548b79	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 08:10:00	2026-02-22 08:40:00	600cc Street (Novatos)	t
d1d62974-e587-484c-b871-b31eda65dcbb	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 08:45:00	2026-02-22 09:15:00	600cc Street (Novatos)	t
2bb8c40a-d774-4182-a1c8-e003ccfd40b9	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 09:20:00	2026-02-22 09:50:00	R3 Avanzados	t
8434bfcc-ebdd-41ec-b815-2ebbb3fe9cd4	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 09:55:00	2026-02-22 10:25:00	R3 Avanzados	t
acf5a1e5-1a24-4357-b9ab-c5eca5ae02eb	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 10:30:00	2026-02-22 11:00:00	R3 PRO (Expertos)	t
ffded6b0-8d69-4b55-b867-26ce245f96b5	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 11:05:00	2026-02-22 11:35:00	R3 PRO (Expertos)	t
ef08530e-50fc-4969-8050-bb52425315bb	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 1	2026-02-22 11:40:00	2026-02-22 12:10:00	R3 Street (Novatos)	t
6260735b-115c-4d0f-a0ac-0b8e64cc35e5	44c3d56c-165d-486d-a571-676e3f8ae44d	Carrera 2	2026-02-22 12:15:00	2026-02-22 12:45:00	R3 Street (Novatos)	t
b6a66272-f4b1-42e4-89f5-7848be48907e	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 00:00:00	2026-11-29 00:30:00	125cc Stock	t
32795940-cced-4f9d-8016-17b8454d2271	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 00:35:00	2026-11-29 01:05:00	125cc Stock	t
271b5f06-a0c1-4864-8868-9f8f6573d08c	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 01:10:00	2026-11-29 01:40:00	160cc Libre	t
fb9aa580-8041-498c-815c-c013d75b7ab9	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 01:45:00	2026-11-29 02:15:00	160cc Libre	t
9c57800c-9cf4-4580-b582-076fe822dbd7	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 02:20:00	2026-11-29 02:50:00	160cc Stock	t
3219d093-e880-4851-892a-a734a781f7d6	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 02:55:00	2026-11-29 03:25:00	160cc Stock	t
b6925ed1-7f60-489c-98d3-73af4e413b5f	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 03:30:00	2026-11-29 04:00:00	200cc Libre	t
69c96629-38c5-41c3-89e1-caa90175a691	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 04:05:00	2026-11-29 04:35:00	200cc Libre	t
94209130-453d-4284-8aa8-4538d8d685ac	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 04:40:00	2026-11-29 05:10:00	200cc Stock	t
c74a221a-72af-4cc3-aa00-ef769eda370a	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 05:15:00	2026-11-29 05:45:00	200cc Stock	t
5bbe482e-3ee8-4f11-9195-fc1cd32aa560	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 05:50:00	2026-11-29 06:20:00	600cc Avanzados	t
bb052dd9-5c1c-4ccf-ba52-c0b70395d44e	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 06:25:00	2026-11-29 06:55:00	600cc Avanzados	t
22625daa-4990-4338-9909-bfe0b22036da	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 07:00:00	2026-11-29 07:30:00	600cc PRO (Expertos)	t
2757c172-7207-4c9d-8f29-9f265eee90b2	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 07:35:00	2026-11-29 08:05:00	600cc PRO (Expertos)	t
88897df0-8232-424d-aa81-db8ec76a5c54	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 08:10:00	2026-11-29 08:40:00	600cc Street (Novatos)	t
10dc99dc-dc6b-4533-8ba7-0f029dd7a814	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 08:45:00	2026-11-29 09:15:00	600cc Street (Novatos)	t
03e7b7b5-553d-4dc8-b016-bc0079032a49	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 09:20:00	2026-11-29 09:50:00	R3 Avanzados	t
f5fac047-53b2-452a-8ea5-c7333c0612df	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 09:55:00	2026-11-29 10:25:00	R3 Avanzados	t
d8a2e5da-1467-4023-b03e-8506958b679b	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 10:30:00	2026-11-29 11:00:00	R3 PRO (Expertos)	t
3e236153-c19d-49fa-b6cc-2bcad672caf0	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 11:05:00	2026-11-29 11:35:00	R3 PRO (Expertos)	t
ad5ccacb-1693-4019-872a-d6eb999dbff6	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 1	2026-11-29 11:40:00	2026-11-29 12:10:00	R3 Street (Novatos)	t
1edc3786-852d-4028-b790-d4f051765bf4	b73ebad1-13e2-4e38-b297-169f69d61eda	Carrera 2	2026-11-29 12:15:00	2026-11-29 12:45:00	R3 Street (Novatos)	t
d1940afb-f624-40e7-a364-26572005c219	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-26 00:20:00	2026-01-26 00:35:00	600cc Street (Novatos) · 5 VUELTAS	t
9e447a8c-abeb-4154-8bb8-3104990caa8a	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-26 00:40:00	2026-01-26 00:55:00	R3 Avanzados · 5 VUELTAS	t
a069d7cd-524f-4941-9f31-24e92ab85c24	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 13:00:00	2026-01-25 13:15:00	125cc Stock · 5 VUELTAS	t
707b798b-bf9a-4c54-bcfc-3b372480b42b	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 13:20:00	2026-01-25 13:35:00	160cc Libre · 5 VUELTAS	t
1a28f003-9043-4e24-a715-6c2b81486b20	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 13:40:00	2026-01-25 13:55:00	160cc Stock · 5 VUELTAS	t
2b1af0a5-4aa8-41c6-bc89-a29cf546b4f2	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 14:00:00	2026-01-25 14:15:00	200cc Libre · 5 VUELTAS	t
24653a55-d8dd-407d-a720-fd56fb3d746e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 14:20:00	2026-01-25 14:35:00	200cc Stock · 5 VUELTAS	t
948a372f-c795-4d85-af95-3cc11306058b	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 14:40:00	2026-01-25 14:55:00	600cc Avanzados · 5 VUELTAS	t
43fb1fab-7b66-4f00-aec4-f77b3d27315e	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 15:00:00	2026-01-25 15:15:00	600cc PRO (Expertos) · 5 VUELTAS	t
65b02fa6-2528-4d8c-a796-728aa62c1568	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 15:20:00	2026-01-25 15:35:00	600cc Street (Novatos) · 5 VUELTAS	t
e4bb29fe-00ce-40be-b01a-9a5a63488933	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 1	2026-01-25 15:40:00	2026-01-25 15:55:00	R3 Avanzados · 5 VUELTAS	t
8bcade1c-9927-420d-b0f6-e5ff69348dc2	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 16:00:00	2026-01-25 16:15:00	125cc Stock · 5 VUELTAS	t
f746477c-0f7e-4891-920f-0991dfa3246a	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 16:20:00	2026-01-25 16:35:00	160cc Libre · 5 VUELTAS	t
d8dc1901-7907-4667-9812-159692927484	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 16:40:00	2026-01-25 16:55:00	160cc Stock · 5 VUELTAS	t
7246d4fc-bcc6-4b62-a17a-1206d8a2450f	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 17:00:00	2026-01-25 17:15:00	200cc Libre · 5 VUELTAS	t
304495b7-aaa1-4b2e-868c-d45f27234faa	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 17:20:00	2026-01-25 17:35:00	200cc Stock · 5 VUELTAS	t
54d20ab4-5cef-499a-8e39-180f7e5b0452	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 17:40:00	2026-01-25 17:55:00	600cc Avanzados · 5 VUELTAS	t
c43e3f11-f58e-436c-b3ac-d8d951c2c4a5	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 18:00:00	2026-01-25 18:15:00	600cc PRO (Expertos) · 5 VUELTAS	t
6fe8ad16-2829-4cc4-8af1-04bd943757ae	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 18:20:00	2026-01-25 18:35:00	600cc Street (Novatos) · 5 VUELTAS	t
08078255-4944-4839-b004-50d681988fa9	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 2	2026-01-25 18:40:00	2026-01-25 18:55:00	R3 Avanzados · 5 VUELTAS	t
9f42b247-a5c2-4e76-9157-fdd90a3eff8c	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 19:00:00	2026-01-25 19:15:00	125cc Stock · 5 VUELTAS	t
ea025e96-f45b-405a-839e-390102bfa6e0	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 19:20:00	2026-01-25 19:35:00	160cc Libre · 5 VUELTAS	t
13aed6f5-5b27-43ca-bef0-2d14b6ebba4a	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 19:40:00	2026-01-25 19:55:00	160cc Stock · 5 VUELTAS	t
29dc5364-d1e4-42a5-8eb0-1cfe1bc55e76	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 20:00:00	2026-01-25 20:15:00	200cc Libre · 5 VUELTAS	t
d2a49b7f-3265-464c-b61e-1bde516c9f5d	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 20:20:00	2026-01-25 20:35:00	200cc Stock · 5 VUELTAS	t
a16a73a0-0106-4cfd-9967-420f924cce06	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 20:40:00	2026-01-25 20:55:00	600cc Avanzados · 5 VUELTAS	t
0280e19d-7527-4e27-a89e-4cb922fe4f6c	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 21:00:00	2026-01-25 21:15:00	600cc PRO (Expertos) · 5 VUELTAS	t
56940e74-71fd-4df3-8277-e6639fb56856	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 21:20:00	2026-01-25 21:35:00	600cc Street (Novatos) · 5 VUELTAS	t
3fa99e10-15e4-49eb-a856-d882db3acba8	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 3	2026-01-25 21:40:00	2026-01-25 21:55:00	R3 Avanzados · 5 VUELTAS	t
77c17440-eb52-4e49-be33-8b69c7d23227	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-25 22:00:00	2026-01-25 22:15:00	125cc Stock · 5 VUELTAS	t
60fdcc27-0125-43b6-a15b-62487165f827	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-25 22:20:00	2026-01-25 22:35:00	160cc Libre · 5 VUELTAS	t
ef26b533-a802-4a5b-a5ee-b47b8e1b4f1d	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-25 22:40:00	2026-01-25 22:55:00	160cc Stock · 5 VUELTAS	t
e2139bc2-65af-4144-ba19-fa0255323411	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-25 23:00:00	2026-01-25 23:15:00	200cc Libre · 5 VUELTAS	t
9e8e079c-e524-4475-9d28-d93910c71b63	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-25 23:20:00	2026-01-25 23:35:00	200cc Stock · 5 VUELTAS	t
d84f0c22-6643-4dbe-baa8-8e7550bc5a73	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-25 23:40:00	2026-01-25 23:55:00	600cc Avanzados · 5 VUELTAS	t
57ba0310-35ce-410a-bf9d-ef6e3652bb30	632508e2-8a71-4e0c-b32f-b14f7b6e2808	Heat 4	2026-01-26 00:00:00	2026-01-26 00:15:00	600cc PRO (Expertos) · 5 VUELTAS	t
\.


--
-- Data for Name: tipos_sancion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipos_sancion (id, nombre, descripcion, evento_id, origen) FROM stdin;
ts-01	Llamada de atención	Advertencia verbal o escrita	\N	MANUAL
ts-02	Multa económica	Penalización económica en Quetzales	\N	MANUAL
ts-03	Drive Through	Pasar por pit lane sin detenerse. NO apelable.	\N	MANUAL
ts-04	Stop and Go	Detenerse N segundos en zona designada. NO apelable.	\N	MANUAL
ts-05	Pérdida posiciones	Penalización al resultado final	\N	MANUAL
ts-06	Descalificación heat	Excluido del resultado de ese heat	\N	MANUAL
ts-07	Descalificación fecha	Excluido de todos los heats de la fecha	\N	MANUAL
ts-08	Suspensión	Inhabilitado por una o más fechas	\N	MANUAL
ts-09	Exclusión campeonato	Expulsión definitiva	\N	MANUAL
5ab55fd6-f61f-47b8-946b-8570a342ba06	ART. 7.1 · Humo en la parrilla de largada	Tipo generado del reglamento PDF del evento. Está prohibido generar humo intencionalmente mientras la parrilla de largada se encuentra formada. El piloto que encienda la moto o acelere en vacío produciendo humo sobre la parrilla recibirá una advertencia oficial y perderá dos posiciones de largada; en caso de reincidencia la descalificación del heat correspondiente. ARTÍCULO 7.2 -	632508e2-8a71-4e0c-b32f-b14f7b6e2808	PDF
5b08bd62-d580-4646-a677-33dea1cc86ca	ART. 7.2 · Uso de silenciadores	Tipo generado del reglamento PDF del evento. Toda motocicleta debe conservar el silenciador homologado. Superar el nivel sonoro permitido implica rechazo en la revisión técnica. ARTÍCULO 7.3 -	632508e2-8a71-4e0c-b32f-b14f7b6e2808	PDF
10666423-76e2-4a41-a410-d30eb05a202a	ART. 7.3 · Velocidad en pit lane	Tipo generado del reglamento PDF del evento. La velocidad máxima en pit lane es de 60 km/h el día del evento. La infracción se sanciona con penalización de tres posiciones. -- 1 of 1 --	632508e2-8a71-4e0c-b32f-b14f7b6e2808	PDF
\.


--
-- Data for Name: sanciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sanciones (id, inscripcion_id, comisario_id, tipo_sancion_id, motivo, gravedad, penalizacion, fecha_sancion) FROM stdin;
8c2a3ee8-cfab-4053-976d-22cfa7174484	6105d65e-93a1-4c7e-951f-5ad526405f58	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	ts-06	El piloto no abre motor por 3ra fecha consecutiva	PENDIENTE	Advertencia oficial	2026-10-26 02:01:40.785
75a0a85b-ad29-4d82-b5e0-36084fb93a54	99dc7db0-798a-42ea-bda5-4366358a3af5	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	5b08bd62-d580-4646-a677-33dea1cc86ca	El piloto posee silenciadores	PENDIENTE	Advertencia oficial	2026-10-26 04:07:58.148
b7e61bcb-7809-4143-b334-21dd24a4c18d	6105d65e-93a1-4c7e-951f-5ad526405f58	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	ts-07	Adelantamiento en el puesto 3, el piloto en bandera amarilla rebasa a otro y gana posición la cual no recupera	RESUELTO	Pena de tiempo (+10 segundos) o vuelta penalizada	2026-10-26 01:59:16.817
986aaf49-9221-40f1-b7fc-7d22e49407b4	2cc5d6ec-05e9-405e-b928-732f2a715c54	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	10666423-76e2-4a41-a410-d30eb05a202a	El piloto superó la velocidad en Pit	RESUELTO	Pérdida de posiciones / +5 segundos	2026-10-26 04:23:06.587
c25f574f-8bbf-45a2-91aa-6e0f528572ea	0eb39e7f-7930-4888-8af6-b9475d3398a7	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	5b08bd62-d580-4646-a677-33dea1cc86ca	El piloto no tenía en buen estado su motocicleta y perjudicó a la salida de los demás pilotos	RESUELTO	Advertencia oficial	2026-10-26 04:34:06.275
\.


--
-- Data for Name: apelaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apelaciones (id, sancion_id, piloto_id, comisario_id, motivo, estado, resolucion, fecha, inscripcion_id) FROM stdin;
\.


--
-- Data for Name: auditoria_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auditoria_logs (id, usuario_id, tabla_afectada, registro_id, accion, valor_anterior, valor_nuevo, fecha, ip_direccion) FROM stdin;
d55ff614-1bdc-4fb3-9488-06276a41e184	7934425f-13dd-406d-bb8e-d6a292f5ed74	inscripciones	i-e1-125-01	UPDATE	\N	{"estado": "RECHAZADA"}	2026-05-21 19:15:41.423	\N
647ed63f-1c64-40ef-83d7-f0a6975e51bb	7934425f-13dd-406d-bb8e-d6a292f5ed74	inscripciones	1f45b05d-d09c-47de-98a1-26c3f25f5090	UPDATE	\N	{"estado": "PAGADA"}	2026-05-21 19:43:07.938	\N
78f59012-351d-4d90-aaca-da1a768a171d	7934425f-13dd-406d-bb8e-d6a292f5ed74	inscripciones	1f45b05d-d09c-47de-98a1-26c3f25f5090	UPDATE	\N	{"estado": "VALIDADA"}	2026-05-21 19:43:09.058	\N
d7e542dc-0f7a-4d43-9b2c-fb7d190db8ce	7934425f-13dd-406d-bb8e-d6a292f5ed74	inscripciones	1f45b05d-d09c-47de-98a1-26c3f25f5090	UPDATE	\N	{"estado": "PAGADA"}	2026-05-21 19:43:25.949	\N
f7128191-1336-4680-ab25-33d51997c7ba	7934425f-13dd-406d-bb8e-d6a292f5ed74	inscripciones	1f45b05d-d09c-47de-98a1-26c3f25f5090	UPDATE	\N	{"estado": "RECHAZADA"}	2026-05-21 19:43:31.86	\N
7fe8fd6a-03e4-4800-b959-b7ed3eb5f7cb	7934425f-13dd-406d-bb8e-d6a292f5ed74	inscripciones	1f45b05d-d09c-47de-98a1-26c3f25f5090	UPDATE	\N	{"estado": "PAGADA"}	2026-05-21 19:43:33.614	\N
9b128b49-96ee-4b23-bf4c-eb5f98578c1c	7934425f-13dd-406d-bb8e-d6a292f5ed74	usuarios	5d9b01db-de71-488a-a175-34a316adbfe4	INSERT	\N	{"usuario": {"id": "5d9b01db-de71-488a-a175-34a316adbfe4", "email": "gbarris@miumg.edu.gt", "nombre": "GUSTAVO", "apellido": "GARCIA"}, "perfil_piloto": {"id": "2b319405-4f68-4784-902b-b934bb9a6ec8", "tipo_sangre": null, "dorsal_preferido": null}, "perfil_personal": {"id": "f424485c-c72a-4d67-9bdf-262f5fcb6333", "cui": "1234567890123", "genero": null, "pais_id": null, "direccion": "11av A, 3-77, Zona 11, San Miguel Petapa", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "56214123"}}	2026-05-21 19:44:37.094	\N
9d739456-e916-4b38-b24d-f570a2552bc7	7934425f-13dd-406d-bb8e-d6a292f5ed74	inscripciones	1befafda-968a-4b4f-9c3a-ba7d7e7fa3c6	UPDATE	\N	{"estado": "PAGADA"}	2026-05-21 20:06:52.102	\N
43c34c84-c813-41e1-830b-e81cdb724341	7934425f-13dd-406d-bb8e-d6a292f5ed74	perfiles_pilotos	2b319405-4f68-4784-902b-b934bb9a6ec8	DELETE	{"usuario": {"id": "5d9b01db-de71-488a-a175-34a316adbfe4", "email": "gbarris@miumg.edu.gt", "nombre": "GUSTAVO", "apellido": "GARCIA"}, "perfil_piloto": {"id": "2b319405-4f68-4784-902b-b934bb9a6ec8", "dorsal_preferido": null}}	\N	2026-05-21 20:13:23.629	\N
702d093b-d4ff-49f8-bf19-1497ede0b7b8	7934425f-13dd-406d-bb8e-d6a292f5ed74	perfiles_pilotos	2b319405-4f68-4784-902b-b934bb9a6ec8	DELETE	{"usuario": {"id": "5d9b01db-de71-488a-a175-34a316adbfe4", "email": "gbarris@miumg.edu.gt", "nombre": "GUSTAVO", "apellido": "GARCIA"}, "perfil_piloto": {"id": "2b319405-4f68-4784-902b-b934bb9a6ec8", "dorsal_preferido": null}}	\N	2026-05-21 20:14:29.633	\N
a9b21d67-bbf7-4e9b-b55e-796594d667df	7934425f-13dd-406d-bb8e-d6a292f5ed74	perfiles_pilotos	2b319405-4f68-4784-902b-b934bb9a6ec8	DELETE	{"usuario": {"id": "5d9b01db-de71-488a-a175-34a316adbfe4", "email": "gbarris@miumg.edu.gt", "nombre": "GUSTAVO", "apellido": "GARCIA"}, "perfil_piloto": {"id": "2b319405-4f68-4784-902b-b934bb9a6ec8", "dorsal_preferido": null}}	\N	2026-05-21 20:15:40.791	\N
a2bb89fb-f08e-4144-8136-d53b9b9ba6cc	7934425f-13dd-406d-bb8e-d6a292f5ed74	perfiles_pilotos	2b319405-4f68-4784-902b-b934bb9a6ec8	DELETE	{"usuario": {"id": "5d9b01db-de71-488a-a175-34a316adbfe4", "email": "gbarris@miumg.edu.gt", "nombre": "GUSTAVO", "apellido": "GARCIA"}, "perfil_piloto": {"id": "2b319405-4f68-4784-902b-b934bb9a6ec8", "dorsal_preferido": null}}	\N	2026-05-22 14:32:58.18	\N
55798bde-c388-4288-8c31-9beb85ed0235	7934425f-13dd-406d-bb8e-d6a292f5ed74	usuarios	bf0fdaf8-ea11-4f38-bdbf-8ba56154831c	INSERT	\N	{"usuario": {"id": "bf0fdaf8-ea11-4f38-bdbf-8ba56154831c", "email": "mceballos@gmail.com", "nombre": "Michael", "apellido": "Ceballos"}, "perfil_piloto": {"id": "0594deec-173b-4877-a8b0-d3049ccdc238", "tipo_sangre": null, "dorsal_preferido": 4}, "perfil_personal": {"id": "d3f2a3c1-6cd4-4238-b339-30fdc02186f9", "cui": "1111222211112", "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "12345678"}}	2026-05-23 02:20:44.92	\N
b988c408-c91d-41e4-9ea2-882621e8b761	7934425f-13dd-406d-bb8e-d6a292f5ed74	usuarios	ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a	INSERT	\N	{"usuario": {"id": "ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a", "email": "gaparicio@gmail.com", "nombre": "Gabriel", "apellido": "Aparicio"}, "perfil_piloto": {"id": "fa2bca6d-6d7e-439b-afa7-d4b0887c8966", "tipo_sangre": null, "dorsal_preferido": 61}, "perfil_personal": {"id": "2c0aada7-3a9b-4f0d-9426-3d115185e45e", "cui": "abcd", "genero": null, "pais_id": null, "direccion": "asad12", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "hola"}}	2026-07-27 14:09:22.499	\N
fa9ad7f6-db9e-4de5-99e3-a0b49e8bcfdd	7934425f-13dd-406d-bb8e-d6a292f5ed74	perfiles_pilotos	fa2bca6d-6d7e-439b-afa7-d4b0887c8966	DELETE	{"usuario": {"id": "ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a", "email": "gaparicio@gmail.com", "nombre": "Gabriel", "apellido": "Aparicio"}, "perfil_piloto": {"id": "fa2bca6d-6d7e-439b-afa7-d4b0887c8966", "dorsal_preferido": 61}}	\N	2026-07-27 14:09:52.752	\N
f79482a1-ab4f-4ceb-99b0-a5aa04005f60	7934425f-13dd-406d-bb8e-d6a292f5ed74	usuarios	acd4423a-028f-4643-a9d2-e85028d41c8a	INSERT	\N	{"usuario": {"id": "acd4423a-028f-4643-a9d2-e85028d41c8a", "email": "jhgasasasa@gmail.com", "nombre": "AGUSTIN", "apellido": "RODRIGUEZ"}, "perfil_piloto": {"id": "63391a52-f03b-4d88-b507-1ddfb875b804", "tipo_sangre": null, "dorsal_preferido": 15}, "perfil_personal": {"id": "bc395726-5de2-408d-8a20-691796f7be8c", "cui": null, "genero": null, "pais_id": null, "direccion": "12av 3-45 Residenciales Alamedas", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "43232343"}}	2026-07-27 16:15:21.569	\N
108342c3-b8da-48bc-a86c-f455b9b928ca	7934425f-13dd-406d-bb8e-d6a292f5ed74	usuarios	4932b935-1bbd-4bae-8bc1-b29d02fe63ef	INSERT	\N	{"usuario": {"id": "4932b935-1bbd-4bae-8bc1-b29d02fe63ef", "email": "dfigueroa@gmail.com", "nombre": "DANIEL", "apellido": "FIGUEROA"}, "perfil_piloto": {"id": "150f33b7-e4d5-41b4-855e-fc347ce3e65b", "tipo_sangre": null, "dorsal_preferido": 11}, "perfil_personal": {"id": "d3d7597d-0800-47d2-9a28-a49c3ae50a9a", "cui": null, "genero": null, "pais_id": null, "direccion": "11av A 4-99, zona 1, Guatemala", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "50212345678"}}	2026-08-03 13:58:28.181	\N
a0c854b0-296b-4cd4-a752-f11f5c501178	usr-admin	usuarios	f98c3274-9c2b-479c-90eb-285b20855d2d	INSERT	\N	{"usuario": {"id": "f98c3274-9c2b-479c-90eb-285b20855d2d", "email": "e2e.test@example.com", "nombre": "E2E", "apellido": "Test"}, "perfil_piloto": {"id": "8c9deeb2-4d54-45b7-8d98-6a5a4186246c", "tipo_sangre": null, "dorsal_preferido": null}, "perfil_personal": {"id": "029ca3bb-56bc-4014-8a32-5c9d830f026f", "cui": null, "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": null}}	2026-08-19 14:59:49.881	\N
44d238ac-0d8f-4553-989f-f5a813b2cff9	usr-admin	perfiles_pilotos	8c9deeb2-4d54-45b7-8d98-6a5a4186246c	DELETE	{"usuario": {"id": "f98c3274-9c2b-479c-90eb-285b20855d2d", "email": "e2e.test@example.com", "nombre": "E2E", "apellido": "Test"}, "perfil_piloto": {"id": "8c9deeb2-4d54-45b7-8d98-6a5a4186246c", "dorsal_preferido": null}}	\N	2026-08-19 15:00:25.688	\N
dd14a2e8-06d6-4e73-93d5-05a771c145ea	usr-admin	usuarios	e2661597-9c39-4bc8-a7e5-7928bb0b6e11	INSERT	\N	{"usuario": {"id": "e2661597-9c39-4bc8-a7e5-7928bb0b6e11", "email": "e2e.test2@example.com", "nombre": "E2E2", "apellido": "Test"}, "perfil_piloto": {"id": "1e0b28f5-451a-4797-9c43-c8a9ec330203", "tipo_sangre": null, "dorsal_preferido": 88}, "perfil_personal": {"id": "f967c3e2-d618-46d4-8e44-db58bdf77a3d", "cui": null, "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": null}}	2026-08-19 15:00:32.27	\N
a9c6c80c-e0dc-4c4b-97e6-db38a8d06fbd	usr-admin	perfiles_pilotos	1e0b28f5-451a-4797-9c43-c8a9ec330203	UPDATE	\N	{"usuario": {"id": "e2661597-9c39-4bc8-a7e5-7928bb0b6e11", "nombre": "E2E2", "apellido": "Test"}, "perfil_piloto": {"id": "1e0b28f5-451a-4797-9c43-c8a9ec330203", "tipo_sangre": null, "dorsal_preferido": 77}, "perfil_personal": {"id": "f967c3e2-d618-46d4-8e44-db58bdf77a3d", "cui": null, "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": null}}	2026-08-19 15:00:32.384	\N
a2385f2b-51e9-45d8-9cab-f800a860f929	usr-admin	perfiles_pilotos	1e0b28f5-451a-4797-9c43-c8a9ec330203	DELETE	{"usuario": {"id": "e2661597-9c39-4bc8-a7e5-7928bb0b6e11", "email": "e2e.test2@example.com", "nombre": "E2E2", "apellido": "Test"}, "perfil_piloto": {"id": "1e0b28f5-451a-4797-9c43-c8a9ec330203", "dorsal_preferido": 77}}	\N	2026-08-19 15:00:32.423	\N
0f77ec87-a531-40b8-a4e9-32e34a85787e	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	181ec4be-9969-4f83-9e9b-096672d2b86f	INSERT	\N	{"usuario": {"id": "181ec4be-9969-4f83-9e9b-096672d2b86f", "email": "susanm@gmail.com", "nombre": "SUSAN", "apellido": "MARROQUIN"}, "perfil_piloto": {"id": "64f057d8-6294-4f8e-8628-63f35d5d829a", "tipo_sangre": null, "dorsal_preferido": 11}, "perfil_personal": {"id": "65c47eaa-6535-40e2-9649-2b77e124f98f", "cui": null, "genero": null, "pais_id": null, "direccion": "121sdasd adfsgr ahsgdhsad", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "50256214123"}}	2026-08-31 01:48:06.467	\N
4d530995-36fb-4d57-a20a-61ea02f62233	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	25332652-7bdf-4697-a2b0-c1813d002760	INSERT	\N	{"usuario": {"id": "25332652-7bdf-4697-a2b0-c1813d002760", "email": "sandratorres@gmail.com", "nombre": "SANDRA", "apellido": "TORRES"}, "perfil_piloto": {"id": "9236a165-b669-4aac-85cf-2da4cc0020c1", "tipo_sangre": null, "dorsal_preferido": 17}, "perfil_personal": {"id": "c2e8c6f4-3980-4ded-90ca-c3ed13716982", "cui": null, "genero": null, "pais_id": null, "direccion": "12av 3ra calle, zona 1", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "50212345678"}}	2026-09-04 19:46:41.428	\N
3c5fe24b-420f-4a30-af06-e916c52e8b7f	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	e9f80104-d0a1-4e14-86df-f14e05169de3	INSERT	\N	{"usuario": {"id": "e9f80104-d0a1-4e14-86df-f14e05169de3", "email": "abc@gmail.com", "nombre": "WILL", "apellido": "TERCERO"}, "perfil_piloto": {"id": "82f3c7c5-fd71-4633-8e42-024b0a159e7b", "tipo_sangre": null, "dorsal_preferido": 12}, "perfil_personal": {"id": "129c0626-0709-47c2-9498-be2619c9d005", "cui": null, "genero": null, "pais_id": null, "direccion": "12asahf", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "50223232323"}}	2026-09-07 01:35:34.607	\N
7b20d676-c2fe-49ef-8035-d673f2740d04	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	aa3a3fb0-cb7a-457e-a43e-612e3e62b729	INSERT	\N	{"usuario": {"id": "aa3a3fb0-cb7a-457e-a43e-612e3e62b729", "email": "lilia@gmail.com", "nombre": "LILIA", "apellido": "BELTRAN"}, "perfil_piloto": {"id": "ad5a8484-4423-4523-aba5-da970c1aded5", "tipo_sangre": null, "dorsal_preferido": 16}, "perfil_personal": {"id": "85b44684-4c1d-4204-8a4b-e2c37171ea73", "cui": null, "genero": null, "pais_id": null, "direccion": "11av aaxljw 3ra av", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "+50234343434"}}	2026-09-13 23:23:25.84	\N
16171b54-e922-4c46-83f6-3266ac814735	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	perfiles_pilotos	ad5a8484-4423-4523-aba5-da970c1aded5	UPDATE	\N	{"usuario": {"id": "aa3a3fb0-cb7a-457e-a43e-612e3e62b729", "nombre": "LILIA", "apellido": "BELTRAN"}, "perfil_piloto": {"id": "ad5a8484-4423-4523-aba5-da970c1aded5", "tipo_sangre": null, "dorsal_preferido": 16}, "perfil_personal": {"id": "85b44684-4c1d-4204-8a4b-e2c37171ea73", "cui": null, "genero": null, "pais_id": null, "direccion": "11av aaxljw 3ra av", "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "+50234343434"}}	2026-09-13 23:24:19.457	\N
2d01b44c-139a-4c57-bcbd-3c443c7f665f	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	fafa9ce8-c672-4db9-bf74-2994c43e9b2c	INSERT	\N	{"usuario": {"id": "fafa9ce8-c672-4db9-bf74-2994c43e9b2c", "email": "qa.1789342380404@example.com", "nombre": "QA", "apellido": "Prueba"}, "perfil_piloto": {"id": "fbd36d2d-fac0-4a82-8a8f-6fc25b0115c1", "tipo_sangre": null, "dorsal_preferido": null}, "perfil_personal": {"id": "5d21961f-5bd5-4e45-86fd-f16dda5b8d8e", "cui": null, "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "+50212345678"}}	2026-09-13 23:33:01.549	\N
f3da092e-eb0c-4ab1-af83-5808936cbbe7	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	cb171882-9e81-4f74-a692-7208a74c8ed5	INSERT	\N	{"usuario": {"id": "cb171882-9e81-4f74-a692-7208a74c8ed5", "email": "qa.mant.1789342517654@example.com", "nombre": "QA MANT", "apellido": "PRUEBA"}, "perfil_piloto": {"id": "39aed92e-5a9f-413b-b46f-0230b47517d5", "tipo_sangre": null, "dorsal_preferido": null}, "perfil_personal": {"id": "7f088edf-e6fa-4d71-96d7-bb0983bcb1ff", "cui": null, "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "+50222334455"}}	2026-09-13 23:35:18.837	\N
d465ddd7-061a-43a7-9844-7fb3f95eb53c	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	49de7aea-1e5d-44d2-a9ad-677baa3522d1	INSERT	\N	{"usuario": {"id": "49de7aea-1e5d-44d2-a9ad-677baa3522d1", "email": "Saraimon@gmail.com", "nombre": "Sarai", "apellido": "Montufar"}, "perfil_piloto": {"id": "122b6d56-a969-4605-ba2c-57e4c7ecf7bb", "tipo_sangre": "A+", "dorsal_preferido": null}, "perfil_personal": {"id": "71acd2c9-4755-4658-97bf-aa9bf15bb917", "cui": "7463 74673 4734", "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": "2026-09-02T00:00:00.000Z", "telefono_personal": "+50223232121"}}	2026-09-13 23:37:43.763	\N
887d831e-4da3-498a-b006-acca2261c118	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16	INSERT	\N	{"usuario": {"id": "99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16", "email": "xiomara@gmail.com", "nombre": "Xiomara", "apellido": "Enriquez"}, "perfil_piloto": {"id": "8a1739f2-9806-42fe-b4ef-a645205b7a8a", "tipo_sangre": "O+", "dorsal_preferido": null}, "perfil_personal": {"id": "80ed11b3-de4f-425a-ad97-7211acce7d5e", "cui": "7637 46744 7346", "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": "2004-06-13T00:00:00.000Z", "telefono_personal": "+523624783264"}}	2026-09-14 03:48:45.039	\N
3074cf56-94e5-439a-80c9-95d4675128ea	5c2ed4c6-8769-4699-91bf-bc61150d0f37	usuarios	85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b	INSERT	\N	{"usuario": {"id": "85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b", "email": "jfigueroah4@miug.edu.gt", "nombre": "Jorge Arturo", "apellido": "Figueroa Miranda"}, "perfil_piloto": {"id": "71333994-3c83-4fe6-b023-cde1eebd086b", "tipo_sangre": "A+", "dorsal_preferido": null}, "perfil_personal": {"id": "f0285498-1d01-48da-a1d8-8163a671e9b5", "cui": "3501 05350 0101", "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": "2002-02-12T00:00:00.000Z", "telefono_personal": "+50256252922"}}	2026-09-16 02:38:24.857	\N
02c985c7-b406-4598-83db-6383c337b388	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	f4276a72-1138-49f1-b210-bd46d1484d57	INSERT	\N	{"usuario": {"id": "f4276a72-1138-49f1-b210-bd46d1484d57", "email": "jurbinas@miumg.edu.gt", "nombre": "JEFFRY", "apellido": "SARAVIA"}, "perfil_piloto": {"id": "333bc2e5-cced-42b4-a09c-017382cee1b2", "tipo_sangre": "B+", "dorsal_preferido": null}, "perfil_personal": {"id": "d182b856-82de-4e00-8ec8-43f1aabc0e4f", "cui": "1111 11111 1111", "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": null, "telefono_personal": "+50231141143"}}	2026-09-22 03:37:26.846	\N
f2ffc4b1-1e9f-4bb0-8af3-a073c08395bc	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	12ba55e9-fd54-44e0-802c-87c1514d6bad	IMPORT	\N	{"omitidas": 0, "importadas": ["c993ec17-0bc6-4037-893e-6ee27740da85", "e18a2105-c9fa-4b16-b8ec-5c82b685cc5f"], "campeonato_id": "12ba55e9-fd54-44e0-802c-87c1514d6bad"}	2026-09-23 05:33:51.074	\N
f58765ea-1cac-468f-91a4-278c99a429c4	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	4a344dde-bd6c-40d5-b318-1ca09b79d96d	INSERT	\N	{"id": "4a344dde-bd6c-40d5-b318-1ca09b79d96d", "nombre": "QA 150cc", "campeonato_id": "12ba55e9-fd54-44e0-802c-87c1514d6bad"}	2026-09-23 05:33:51.093	\N
799a2242-47c4-45d2-8c1f-f7be991a315e	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	18b79db9-45da-4f01-95cf-6a6a01d2d209	INSERT	\N	{"id": "18b79db9-45da-4f01-95cf-6a6a01d2d209", "nombre": "QA Test 175cc", "campeonato_id": "camp-01"}	2026-09-23 05:44:03.29	\N
58ac8133-e68f-48d0-900a-35b04e1e81a6	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	9610016c-c135-458b-aa59-984e52d52b2c	INSERT	\N	{"id": "9610016c-c135-458b-aa59-984e52d52b2c", "nombre": "QA Test 175cc", "campeonato_id": "camp-01"}	2026-09-23 05:47:37.993	\N
87d6d475-230e-49e3-b813-252d04970813	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	c43b51ad-6842-4077-8a13-9af82d5ba339	IMPORT	\N	{"omitidas": 0, "importadas": ["bb9872c9-709b-434b-b520-631d2d9ed3ac"], "campeonato_id": "c43b51ad-6842-4077-8a13-9af82d5ba339"}	2026-09-23 06:00:36.233	\N
73ba2fc0-30c9-41e1-8b6a-b88c37e7ff31	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	c43b51ad-6842-4077-8a13-9af82d5ba339	IMPORT	\N	{"omitidas": 0, "importadas": ["4edc2643-80bb-428a-9df2-9204e7589e0b", "cf5749d7-d6cf-49c3-8a4e-15954d5ffda7", "47472be2-198c-4d1e-8799-483f9848b09f", "4ad088d6-3e20-4f03-bf2c-609c66b149f4", "d4184a7d-8c56-4bc5-a62a-6f1c87db2698"], "campeonato_id": "c43b51ad-6842-4077-8a13-9af82d5ba339"}	2026-09-23 06:06:49.576	\N
c27d2991-c585-4e00-b7eb-79efd24f64f0	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	d2385aee-348a-4eed-9bfa-2b38fd086576	INSERT	\N	{"id": "d2385aee-348a-4eed-9bfa-2b38fd086576", "nombre": "Sopas1", "campeonato_id": "c43b51ad-6842-4077-8a13-9af82d5ba339"}	2026-09-23 06:20:19.608	\N
72a91c6f-a219-4b7f-a73a-884eced184fd	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	campeonatos	2026-2027	CLONAR_ANIO	\N	{"criterios": {"copiar_fechas": true, "copiar_categorias": true, "copiar_cronograma": true}, "origen_anio": 2026, "destino_anio": 2027, "fechas_creadas": 5, "series_creadas": ["f8cb5eb3-f6d6-470a-ba53-5fb39c97e8d2", "6727eac2-3f3e-4578-b073-32fd5a141b7e", "5620424f-5b1d-4e84-9fc6-fe5d62341829"], "categorias_creadas": 11}	2026-09-23 06:33:03.133	\N
ee1efea6-d82e-43d2-b06d-4d76126e2413	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	campeonatos	2026-2027	CLONAR_ANIO	\N	{"criterios": {"copiar_fechas": true, "copiar_categorias": true, "copiar_cronograma": true}, "origen_anio": 2026, "destino_anio": 2027, "fechas_creadas": 5, "series_creadas": ["88141427-8513-440c-8cdc-b5abb73b449c", "756c2be1-aed8-462d-8ebd-db8cfdff7245", "564353c1-4c57-4390-b82e-d655b5449b6c"], "categorias_creadas": 11}	2026-09-23 06:38:09.757	\N
5533efa2-5b6c-4830-9c56-78d162dea831	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	756c2be1-aed8-462d-8ebd-db8cfdff7245	IMPORT	\N	{"omitidas": 0, "importadas": ["e21915e6-15fb-44f5-9100-26beac8fee0a", "b6092978-4fd7-46fe-97e7-0fbae2989569", "4e726fbe-8df4-4a95-865d-4c929c702544", "fd83ca34-6083-408e-a255-d0886e3167b2", "85f228b4-c2da-4091-9291-896d1a6310b8", "ed2fb93e-9f68-4627-b1dc-895f95c505f6", "a6a2f43f-8a81-4463-b5c1-cd66c27f8a78", "1d8931c4-664a-4e21-85b7-0affd669ed93"], "campeonato_id": "756c2be1-aed8-462d-8ebd-db8cfdff7245"}	2026-09-23 07:31:38.788	\N
3f5c7770-95bb-4fe1-bf11-18dbc349a826	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	campeonatos	2027-2028	CLONAR_ANIO	\N	{"criterios": {"copiar_fechas": true, "copiar_categorias": true, "copiar_cronograma": true}, "origen_anio": 2027, "destino_anio": 2028, "fechas_creadas": 5, "series_creadas": ["24b8cafd-49f6-41f1-a767-0291532e78dd", "25b30858-4a12-4211-8b91-fc0c24ce5c42", "3205ae52-a792-4dc3-be7d-17957a8fd851"], "categorias_creadas": 11}	2026-09-27 23:17:29.962	\N
e9d5c235-cec9-4b18-8158-0e8ad9ac42ce	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	db6e5865-6f32-4612-a63f-6e859c7dce30	IMPORT	\N	{"omitidas": 5, "importadas": ["2c0532d6-e470-41ad-bd94-224463b8fda1", "53c88ef6-b7b5-484c-8c53-8eaf99912f9b", "b04790fb-fc62-41d2-8890-7871d4ea6de6", "80f6253e-cce3-4772-8265-0ac5aef3e4af", "4c9d8564-d3a0-4e40-91d4-a12eb1131cf3", "87588097-ac67-4129-8808-284c56f70afb", "80c80cc9-e6d3-421d-8674-d91f0c65041d", "0bc16fc6-4008-4d51-b00c-9334f5b9a528", "090fd59e-b513-4bed-afe6-84689c786656", "59749502-1b8f-4a23-b1b4-895155182ee8", "e3b7bb7b-5f12-4bd8-9485-7b9a89b5395a"], "campeonato_id": "db6e5865-6f32-4612-a63f-6e859c7dce30"}	2026-09-27 23:19:48.015	\N
df006146-79bc-4583-8e9c-8d80a4c48cfa	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	c9d67dca-02cf-47b0-8052-209fa7e8d906	INSERT	\N	{"id": "c9d67dca-02cf-47b0-8052-209fa7e8d906", "nombre": "Semi1", "campeonato_id": "db6e5865-6f32-4612-a63f-6e859c7dce30"}	2026-09-27 23:21:19.542	\N
6f930c99-59c0-49e4-97fe-c711f1f61d13	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	d5e344de-fc4c-4eeb-b010-5dd5640fa90c	INSERT	\N	{"id": "d5e344de-fc4c-4eeb-b010-5dd5640fa90c", "nombre": "Semi2", "campeonato_id": "db6e5865-6f32-4612-a63f-6e859c7dce30"}	2026-09-27 23:21:57.581	\N
41221e14-08e0-4401-8801-a54762c2ff4d	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	usuarios	aafb5462-269d-47a8-8319-dab9c71a9f75	INSERT	\N	{"usuario": {"id": "aafb5462-269d-47a8-8319-dab9c71a9f75", "email": "franc@gmail.com", "nombre": "Francisco", "apellido": "ZuÑIga"}, "perfil_piloto": {"id": "386da8a0-101c-4ccf-ba27-a9d60107a2fa", "tipo_sangre": "B-", "dorsal_preferido": null}, "perfil_personal": {"id": "f904604c-1ee9-4378-90c2-77a7c881cec2", "cui": "8796 73687 3264", "genero": null, "pais_id": null, "direccion": null, "municipio_id": null, "departamento_id": null, "fecha_nacimiento": "2004-07-09T00:00:00.000Z", "telefono_personal": "+10291028192"}}	2026-09-28 01:45:35.916	\N
5bde2919-3852-449d-9645-c4b95ed5f85d	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	c43b51ad-6842-4077-8a13-9af82d5ba339	IMPORT	\N	{"omitidas": 0, "importadas": ["1f494e3c-bc1d-4c8c-93ba-77bf586afbb1", "965c1c24-8823-41fb-b3f2-eb6b7e63f885", "5f3ec9a5-bf47-41f7-a018-70869d5900cd", "c6a44f99-43bb-4d49-aca9-68b33455bed3", "6b62ac47-c4ea-4793-bc7b-68bd71d9778e"], "campeonato_id": "c43b51ad-6842-4077-8a13-9af82d5ba339"}	2026-10-14 17:26:40.84	\N
e3257dc9-5c93-41cf-8650-c28bfdc875d1	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	ffac4ff6-82fa-4ac2-90ef-083d26193ebe	IMPORT	\N	{"omitidas": 0, "importadas": ["7954aa1b-1a57-4e58-aa4a-e6a969d13be4", "3fcae785-7a80-42a1-a19a-dc80251ba073", "75c607d4-3f40-4326-98d6-49132b241828"], "campeonato_id": "ffac4ff6-82fa-4ac2-90ef-083d26193ebe"}	2026-10-14 17:28:48.378	\N
afb49f80-399a-4556-b333-bdc17cabf735	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-26 01:37:53.763	\N
fc16cb07-8deb-4032-bac8-7aab3572b275	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	categorias	86361bcf-d2e8-4512-95bc-87b4e14c5caf	IMPORT	\N	{"omitidas": 0, "importadas": ["dcfd329d-d1d4-45e8-94c5-78ce227322b8", "5b6b4534-cb55-4d80-8673-d00c0291e468", "1a3d18dd-1e00-46d0-b7df-ab0103f21e98", "a7aa77dd-01c6-4869-9e4a-afc9852ece21", "54e41a44-45a3-4c43-81ef-6eb6f34ea4c2", "88472024-a1fe-431f-821c-c2a9145fe001", "171191e9-ac7d-43c5-b0cb-95346f9aa706", "d2a55f34-6fc4-4a54-a035-94f8ed4c1ed5", "b7f4c8c9-a48b-4f19-9d04-ce12c2a51a58"], "campeonato_id": "86361bcf-d2e8-4512-95bc-87b4e14c5caf"}	2026-10-26 01:39:18.842	\N
4a37e826-12a0-4717-9b9c-29f4883a5832	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 00:49:22.503	\N
425e21a5-1770-4b20-b7e3-8454d7d6f7ae	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 03:27:48.999	\N
a9dfe693-4724-4583-9128-ac2f2bfdac58	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 03:28:40.862	\N
a49be4cc-ed1e-4f51-9fb4-09b9f447e994	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 03:29:36.329	\N
36c528ae-20e9-43a8-acef-75dc0e344064	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 03:30:07.647	\N
bc5f1efc-1ec5-4a6f-bd76-6dfe64499884	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 15:31:45.347	\N
7d840e1a-edef-44ff-91b7-b89de6919f9f	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 15:32:02.247	\N
f6659a96-6f2b-4b50-81e5-3708b7d724d8	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	632508e2-8a71-4e0c-b32f-b14f7b6e2808	UPDATE	\N	{"id": "632508e2-8a71-4e0c-b32f-b14f7b6e2808", "estado": "ABIERTO", "nombre": "ACMG 2026 - 1a Fecha", "visible_portada": true}	2026-10-27 15:32:18.259	\N
95aeef03-3186-4c24-a294-c00a03d4745c	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	eventos	44c3d56c-165d-486d-a571-676e3f8ae44d	UPDATE	\N	{"id": "44c3d56c-165d-486d-a571-676e3f8ae44d", "estado": "BORRADOR", "nombre": "ACMG 2026 - 2a Fecha", "visible_portada": false}	2026-10-27 15:40:38.997	\N
\.


--
-- Data for Name: grupos_categoria_evento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grupos_categoria_evento (id, evento_id, nombre, descripcion, tiene_clasificacion, clasificacion_completada, heat1_completado, heat2_completado, orden, creado_en) FROM stdin;
\.


--
-- Data for Name: categorias_en_grupo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_en_grupo (id, grupo_id, categoria_id) FROM stdin;
\.


--
-- Data for Name: clasificaciones_generales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clasificaciones_generales (id, piloto_id, categoria_id, campeonato_id, puntos_total, posicion, actualizado_en) FROM stdin;
ecc5eba8-471a-4aaf-8d02-058b428e9bfb	8a1739f2-9806-42fe-b4ef-a645205b7a8a	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	1	2026-10-29 01:48:09.923
77d8203a-b6b6-4910-a8ea-f22f82667f02	pil-19	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	2	2026-10-29 01:48:10.063
fb71c0d7-6430-4f05-b219-f344bb61faf2	pil-17	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	3	2026-10-29 01:48:10.146
016a622c-e164-44e4-bc1c-02c70c0b12c5	pil-18	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	5	2026-10-29 01:48:10.295
c6930439-c9ae-4458-861d-3022e6ad2ab8	pil-16	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	6	2026-10-29 01:48:10.362
995c6030-42f1-446f-a7fd-6b7a8b64f9ab	64f057d8-6294-4f8e-8628-63f35d5d829a	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	7	2026-10-29 01:48:10.418
97d7edff-f2c2-4bed-8478-e0ea2b9a9179	pil-10	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	1	2026-10-29 01:58:44.162
ff382353-9674-49f0-97a6-7a2144d2eae9	82f8ae7a-fa73-4b0a-9313-f001a94ae9cf	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	2	2026-10-29 01:58:44.237
65515d89-df85-4b15-9942-d847bae4260e	pil-20	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	3	2026-10-29 01:58:44.304
f53dec89-285d-4522-91cb-e21e04d7b93b	0594deec-173b-4877-a8b0-d3049ccdc238	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	4	2026-10-29 01:58:44.367
\.


--
-- Data for Name: heats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.heats (id, categoria_id, nombre, vueltas, esta_activo, evento_id) FROM stdin;
16023bb9-ed54-4f96-abe5-80c7e68cd62c	a25afd04-daaa-41d6-9074-048dba75fc93	CLASIFICACION - EVENTO:632508e2-8a71-4e0c-b32f-b14f7b6e2808 - CAT:a25afd04-daaa-41d6-9074-048dba75fc93	0	t	\N
\.


--
-- Data for Name: comentarios_resultado; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comentarios_resultado (id, heat_id, comentario, autor, fecha) FROM stdin;
\.


--
-- Data for Name: configuraciones_pago; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuraciones_pago (id, evento_id, proveedor, clave_publica, clave_privada, webhook_secret, esta_activo) FROM stdin;
\.


--
-- Data for Name: items_checklist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items_checklist (id, nombre, descripcion) FROM stdin;
bfc6bb7a-9190-43fc-8299-a2f4f95ddddf	Frenos delanteros	\N
a48c5f46-0b06-4262-b8f4-a657a1f2d8cb	Frenos traseros	\N
a54546b7-ff8c-4380-bae9-e0f21e0172ea	Neumáticos	\N
bd508071-9132-4dfc-a417-00055d5e75cf	Dirección y suspensión	\N
d1bdb79e-845d-4811-bcaf-c607d999e6af	Chasis y carenado	\N
799b2a07-d2f7-4980-8064-33ce15d4335b	Aceite y líquidos	\N
5fbdfe66-480e-4b74-b93a-552fa081b3eb	Sistema eléctrico	\N
19be2fd0-8145-498d-ac24-8da29ce20986	Equipo del piloto	\N
\.


--
-- Data for Name: revisiones_tecnicas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revisiones_tecnicas (id, inscripcion_id, usuario_id, motocicleta_id, fecha_revision, estado, observaciones) FROM stdin;
324cdce3-faa2-48c2-988a-945e8dc11001	7de4b2b7-62a5-4f55-adba-e9d359621d70	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
fa561633-f802-42b2-a155-52a3850079a8	4a17d079-a8fd-4991-8c16-387787bab954	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
eb40f9ed-d452-45f8-b2b0-795a66bb3e46	6dc7dcac-0e61-4b86-b8f3-bd88402195a4	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
d35666cb-4fd0-449d-9117-4f3d20b08376	f18a2abe-e669-4424-9dee-6ee2ed3d9964	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
e06d7de1-0a66-403f-987a-98c3d4e8c4b5	a8e124d4-92fb-41cc-8daa-bc66d0f5bbf9	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
85b4116e-887f-43d1-a82d-4ef24984f591	bb8ce079-2d57-4926-b9df-296e4b033132	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
b3d5f4db-7cbb-4f74-bdec-151c9bbf5122	4f35b15f-981f-4f92-abf3-b66874bf6f91	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
5723487f-85e7-4881-8de9-6660360c09da	8f971893-d48a-4fb1-bc25-56024775182b	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
89ce0e16-7122-47b5-af3a-3203db3c20b7	6e81efd5-f7a7-4474-8f90-1366af0584c0	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
f67c9ffa-e59c-4643-ac7f-c379dfb006d7	9d2a8b5b-bab4-42a9-990e-9f34661b4fc6	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
44c636c4-de51-48b4-9295-0c63dfa0ad7b	bd9bd057-48aa-4391-8180-e928c78525f0	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
197f08df-bde5-4e7a-bb81-13edf195c7ee	168a3429-9fc9-437b-b8c1-3e7a5d4b3ec9	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
fa9d3a9c-0bad-4352-b0f6-d0fabee38956	c76158a6-76ea-4520-8e2c-7d929c009bd3	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
1da85bbf-69d7-4da1-b598-aa86412f6876	85f4dc93-1094-4918-b479-968b98b46188	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
15d3c901-13c0-4703-a385-1130aa510095	531853cf-0931-4e61-bb9f-25ccc26be135	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
9ba859c2-4a5e-4724-bbfc-4181d8bc5e91	3b5eade9-1de0-4cb5-91b5-accdb9ff6f3d	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
728d4f99-f7cc-4958-9bd7-7130ffbe19f7	ac1ca254-10e5-44c6-857e-d12ed6a1bdf4	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
5e591589-a03d-469c-a7c9-c9bd0d918aed	2620a7f2-5117-4f5b-a0a2-598a3e3f71e9	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
04b7a83a-3acf-4e25-bb60-1715b1609199	2f793bcb-8623-487c-9ea3-28665fc9fecb	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
3a0a32a4-cc00-46e6-8016-77559053b724	c3a3897c-834d-43af-af14-6dde59f6a552	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
90174fdb-51fa-47aa-bb7b-f203cf875c06	bc0a64c9-c658-4334-bc55-12ea3220c72b	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
b8a8d1e6-bf50-4d41-ab28-762dd8735df8	9038f4f0-129e-44da-b8a2-97df113481ec	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
e2859ebd-3fc9-48c6-86cc-3bc9c3d868a0	ae730f11-52cd-479f-a538-d3c28fdb5160	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
1791c77e-7c81-4b02-a122-5bb7a49d006d	ef686243-55e1-4f3a-841a-d3339f662085	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
1f01af0c-fa5c-473a-9224-3c968c1f9e22	e5c15fb8-c6ab-4d5e-8c73-6672cf53de78	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
09449a06-8796-4733-a6e4-8c8601542bea	4fe00ea5-0615-497f-8915-25d2aa60b01a	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
be2123be-cd0d-4322-9519-d2527157f089	6ed30303-1646-46ee-b876-e4022759e5f4	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
605731f9-baa2-474f-85bc-98991549fa1c	51250210-810b-4328-af59-5248b70b673d	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
5c0f861e-de8e-4e32-8764-1c331d298bf3	a82215f8-f2ad-4409-845a-18ad553cd3ab	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
4f73f073-c8a1-45ff-99d2-dcc8b3e31797	a25de06b-8fb8-4a1a-ab87-617eeab8e30e	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
03ae21aa-a193-464e-8315-53f10d37dd98	a31479e9-8068-4708-9303-16781947ece7	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
51c4e5c8-d03e-4d7b-887d-ce4cd79afddc	4493d767-8cd0-4e4e-9e5e-12b709590ad4	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
f9f8480a-5331-4cec-a524-89b81e2a7020	39c1df02-a5ff-441a-bc63-2a695a641c2b	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
393a88d6-88e0-4b2b-9136-6207d3602c3c	03e65d9b-bf3c-4c84-985c-b9210ebf3dd9	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
4ea9f2c8-b2ad-404a-8c74-66cf87745804	084de629-4ba8-4bb4-93e7-2ccbb155eaff	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
229d387d-3955-4d80-bda7-68709aa14f55	0eb39e7f-7930-4888-8af6-b9475d3398a7	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
83e97b59-5c46-4cdc-9900-8f8b1f877ded	5ea2676c-89e7-49ca-8e1a-a20f66149a3f	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
39f90ff3-7195-4180-9388-b6ed85a504a8	bb71099f-9942-4be5-9165-cb66203ba965	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
13709418-fe25-4983-92ae-46d2e2091429	7ffb45a1-a25d-4f95-8a54-945167fe0eae	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
239f972a-ee3a-4fa8-91af-b1c48511e9e1	80e0b288-2fbf-401d-b2c1-4a11b5d7efef	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
7711615d-3b25-4c16-8f41-03fa583f7160	88b1a372-8651-4dc1-8578-e151b2e715d3	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
f6b64559-627b-43d4-820f-9c27bee5b800	ba6c4f8d-ddea-4794-a1c0-eda62beea302	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
91483816-957c-4216-98c3-1b1f8424643b	d69977d9-6c22-4f36-8816-b47fda58546a	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
d6aeb58b-b2b3-4c5a-85bc-b5c04b2bbbff	322d4ce6-1572-498b-b773-f798f159b25d	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
389fa64a-eed7-49d1-90ca-8a1c1c8b263b	0d656014-a921-4b3d-b8bb-b38fd05412e6	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
cc9339a2-81c8-4f10-a0f3-c4fc3001a2ac	f558b698-c8cc-4e18-ae2b-012d88ec177e	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
6bafea72-1d75-452c-91e3-0ac50356764f	1af3c488-48be-4f43-a64a-b7f96054b0b1	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
907d3a9d-04ed-4a5f-b647-641d6f39f274	5627eaf4-9bb6-4fd5-bb8a-41de3eddb903	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
5edc2a64-c014-47c5-ab79-a385a065ae06	7005a1fb-dbe6-4227-b06a-a92da3ff5387	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	APROBADA	\N
ed26882a-0ab8-4735-b1c3-a125e2dac124	40611517-47d5-4969-8e32-a3d4076e0101	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
9e3b3dba-588d-4020-9cd2-d5eb37238fdc	6105d65e-93a1-4c7e-951f-5ad526405f58	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
9ae6917d-9983-4f01-8e10-62da29ca554a	5ebac4c5-191e-4c08-b782-e7b30ec033fe	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
ee08f264-a2e5-438f-9a86-9e6046c80bde	4d948b4a-892a-4715-bca3-d27325772d76	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
008e6295-6062-41aa-821c-610432b9c3da	f1ef240b-4afe-401f-8ff4-6a8c27f25bff	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
ae710b32-39ca-464b-85f6-8cb639d6c9d8	5b1ba89f-6c66-4d32-a7df-f8b36d793137	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
c08b4038-dc38-49ae-825a-70af6314dd93	89966ed4-b1ef-4986-b33e-38bf299e8b6f	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
2a9ca01a-de60-4407-8eab-fece0f4d5f7b	07ebf7bd-e662-4470-b8b5-b3f18846ca5e	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
10d4d5b4-3e0b-45dc-9617-4dd00193469f	f7a86a3b-8831-42ee-9141-e4260e2cec90	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
31305cd0-e7a0-4f7f-9bda-7692b9c16d31	be489eb6-5ed0-4ab1-9ec2-90f2a56f38ff	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
981afdc3-cff9-4894-a259-7cd81921e53c	31370c4f-2bec-4fe1-8f72-696e23a1d3d8	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
e163a4bf-d28d-471d-9ab1-da19e88d7524	4801e4a8-cc5e-4b62-9172-87697172b465	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
e6eaad70-31be-4099-9b70-1c36fc336278	10ddcd5f-1115-4fa9-9b17-277100dc35a4	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
5b2e5f4e-0950-4e8b-8db4-836af12dda60	89c04d10-bca7-4518-b56e-d91f1b63b182	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
6b5c077b-ae54-42a3-8231-82268aa41ff9	558ef655-edca-467d-b792-80864b1b239b	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
db76c71f-64d0-4307-87d3-7ed776973667	23da9d4f-70c3-442c-81ec-ffd81403693e	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
4674a012-5c9c-4341-97ce-5f6b53c6a285	52e06d1c-c8f1-432a-b5e2-5d8f3ba3d51c	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
5c8b67b2-9c88-4302-b6b4-00d4bbaecda5	6efe4c44-534c-43a8-a829-cc8a622a4650	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
a2b4d0a9-3127-434d-a4ca-0777d81f7b16	da3a2097-3b19-4c6d-bcc6-0c0e797b2175	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
9100c6b7-b48c-46e7-b715-056c063e0836	495d4ebb-9b36-41ce-9365-3577ce094c1e	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
125f911b-ec63-42b6-bce5-c1e8ee421cd8	f7abdaf1-525e-4a3e-b134-917f0bc4aa16	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
c1832b4a-749d-486c-9d68-4751e8b016a4	d18e47a8-9d6d-4bc6-a703-4a35834ec153	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
b3431c61-12fc-44f7-8ca4-fa6441e51086	76a6ff37-a94d-40f7-a4f0-7841e28934ea	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
ab02aa22-a6e8-4231-8472-8a208b52b21f	c64816ca-83d4-4d7e-9503-ca7965b13632	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
349b5c2a-821e-4cfe-b0ee-f811540ce444	74225b60-27bf-4bc8-8d18-fe891dc8037e	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
27dd94af-8101-4617-8a0c-623d0d248c7c	ca50f7b3-46ab-4e07-8187-3e79177bd3e7	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
fbe6cc78-6748-4a8c-aaf7-11a4060d9895	40d7a101-88b4-4acd-b94c-3f0577e622c5	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
fbf5481e-2355-499d-a4a9-1cd98af06594	974efda0-2940-4d65-93da-b22329f142f3	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
eced1f84-dce3-48ba-a96d-af3cfabc6592	e682cebc-d58e-4d77-b861-da9bdee9aa58	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
633e7b8d-673e-4d0a-8ec9-4a8fca9ad3c7	43c9f149-aad0-4713-bc6c-615592b52860	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
cc9b9698-ba08-47e4-9701-1a8c4f5675de	7ff7ca78-c08a-4d82-bdf7-c54e8f18b64c	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
6724ae0d-0b41-40b6-9028-f18b9e352d25	6ae126a8-582d-4d4a-a518-d216839abfba	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
b5725b22-ee67-46a4-9ffd-6dfd243296fb	3c7f3e31-b037-4d74-b5ff-1189f53905bf	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
81710af1-5216-4363-89be-195f94a80628	f7ccfac1-4cd1-47d3-abab-afac3122e871	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
5a33bce8-d84c-4292-bdfb-520803b08d4e	9e6da6b8-660d-4ebc-9db6-76848886a667	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
7ea36d0e-74c5-4959-8a6a-77e679b3a2ed	34a7d522-891e-4a15-8b7d-7266cbd2575c	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
1eb5500e-1ba4-45fd-acc8-5c9f5f803d4c	544b80b8-f72b-46be-8f31-cba1f3d3f59e	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
2b06aef1-b52d-44be-b24d-835e59ca8f89	2cc5d6ec-05e9-405e-b928-732f2a715c54	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
2a0d79d4-2c51-42d2-8354-a2ff1b3f63b3	2fa70046-9bd9-4f5f-9ce8-df7b63f2b88b	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
cb9bb392-c208-4c7d-a432-32617002021a	fb299a2d-3a02-4ab2-8868-5c1cbccbeaf2	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
16003150-14af-453b-b970-a1fb4e52c059	1b8b088b-0c69-49e4-9d32-72e567a645e0	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
c7bb1c94-a3f9-4942-acbf-8c18e6f5d8b7	705d5e98-59b9-43e9-9df6-41308385bee6	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
c2fcd090-d548-4d4a-8c7f-d3f87a8c30ab	531a03d2-7d24-4984-85c8-83d0038adc02	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
b70c5c74-0311-4295-a32f-69c29f3882f6	f088f84e-d103-4b3b-be51-d1328f0190fa	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
3ac735d0-7828-49e8-82de-fb560ddb3f5f	99dc7db0-798a-42ea-bda5-4366358a3af5	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
e28b5383-b9f5-42c4-b651-086e02c3fa6c	4b87c0b2-852c-4d04-9320-0ca2bb05fdc8	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.541	PENDIENTE	\N
d789e71b-c99e-401d-a6f5-d083ff6f1f47	c1d21401-52df-4b86-91a5-e8b3cb44f821	6a461f7e-873d-46c1-8965-85dd7aa479ab	\N	2026-10-26 04:12:47.54	PENDIENTE	\N
\.


--
-- Data for Name: detalles_revision; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalles_revision (id, revision_tecnica_id, item_id, esta_bien, comentario) FROM stdin;
\.


--
-- Data for Name: esquemas_puntos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.esquemas_puntos (id, categoria_id, posicion, puntos) FROM stdin;
\.


--
-- Data for Name: evidencias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evidencias (id, tipo, nombre, ruta_archivo, mime, tamano, inscripcion_id, sancion_id, creado_por, "createdAt") FROM stdin;
87779927-016e-4abf-862e-7ca43a8e6d41	IMAGEN	Figura-2.1-Arquitectura-3-capas.drawio.png	/uploads/evidencias/1792979874487-22c992ec.png	image/png	80767	6105d65e-93a1-4c7e-951f-5ad526405f58	b7e61bcb-7809-4143-b334-21dd24a4c18d	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	2026-10-26 01:57:54.499
403375af-30b6-4182-9de0-43b7d3561e10	IMAGEN	Figura-2.2-Despliegue-local.drawio.png	/uploads/evidencias/1792979874555-9b869d83.png	image/png	34044	6105d65e-93a1-4c7e-951f-5ad526405f58	b7e61bcb-7809-4143-b334-21dd24a4c18d	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	2026-10-26 01:57:54.57
5cda7805-b05f-4a4f-bd03-faff6015386c	IMAGEN	Figura-2.3-Modulos-vs-Entidades.drawio.png	/uploads/evidencias/1792979874608-2c4267f1.png	image/png	69868	6105d65e-93a1-4c7e-951f-5ad526405f58	b7e61bcb-7809-4143-b334-21dd24a4c18d	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	2026-10-26 01:57:54.629
e1e020fc-89a2-432e-831a-d7ad9ade9887	IMAGEN	Captura de pantalla 2025-07-29 165549.png	/uploads/evidencias/1792980067833-5c94a094.png	image/png	57184	6105d65e-93a1-4c7e-951f-5ad526405f58	8c2a3ee8-cfab-4053-976d-22cfa7174484	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	2026-10-26 02:01:07.842
7fa8706f-2fe2-4e66-987e-3cc6d5b0b5ac	IMAGEN	Captura de pantalla 2025-07-29 165549.png	/uploads/evidencias/1792987553935-6c196b0f.png	image/png	57184	99dc7db0-798a-42ea-bda5-4366358a3af5	75a0a85b-ad29-4d82-b5e0-36084fb93a54	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	2026-10-26 04:05:53.944
fdbdbf2f-2e3c-4e4f-a5d2-5c32ac16a05b	IMAGEN	Captura de pantalla 2025-08-05 112627.png	/uploads/evidencias/1792988556749-5841c91f.png	image/png	1933848	2cc5d6ec-05e9-405e-b928-732f2a715c54	986aaf49-9221-40f1-b7fc-7d22e49407b4	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	2026-10-26 04:22:36.782
41cfaffb-2443-4e4f-9b09-443a6ff74f90	IMAGEN	Captura de pantalla 2025-08-12 194508.png	/uploads/evidencias/1792989177935-19b5eec6.png	image/png	31669	0eb39e7f-7930-4888-8af6-b9475d3398a7	c25f574f-8bbf-45a2-91aa-6e0f528572ea	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	2026-10-26 04:32:57.952
\.


--
-- Data for Name: galeria_fotos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.galeria_fotos (id, evento_id, url, descripcion, subida_en) FROM stdin;
\.


--
-- Data for Name: inscripciones_motocicletas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscripciones_motocicletas (id, inscripcion_id, motocicleta_id, fecha_asignacion, observacion) FROM stdin;
8dbb7d72-96e5-4217-bbdd-a29c0c86744d	6105d65e-93a1-4c7e-951f-5ad526405f58	d6a78811-7c6e-4a8d-bd12-7200da7d82cd	2026-10-26 01:39:42.877	\N
35196b9c-cd33-4382-8de9-e6770bb8dccf	c1d21401-52df-4b86-91a5-e8b3cb44f821	d42b4121-58da-4bdf-8697-13a25a8024af	2026-10-26 02:02:21.192	\N
ac5ff9ee-0306-48f7-82af-d8ef17b584bd	6dc7dcac-0e61-4b86-b8f3-bd88402195a4	41364bfe-58a8-4e3a-97e5-64270c184bee	2026-10-26 02:03:53.861	\N
a9cef281-05dd-4b29-a311-4539941501a4	f18a2abe-e669-4424-9dee-6ee2ed3d9964	moto-04	2026-10-26 02:04:16.858	\N
fcc60244-20cd-48c4-8899-243712b62b8c	a8e124d4-92fb-41cc-8daa-bc66d0f5bbf9	b4e0caa8-c981-4c48-9ab1-30d71ce75ea6	2026-10-26 02:04:50.534	\N
cf999779-5f65-4fcd-a889-7965b3d462b8	99dc7db0-798a-42ea-bda5-4366358a3af5	cba806b5-7857-455e-a5cb-13d204828efc	2026-10-26 03:16:19.3	\N
b13df917-2958-4a24-b30a-4853ab681aa7	4934a38a-5065-4235-b6c0-8292a0a37b23	1ccdf64c-b333-49b3-ba60-43099bf3a4f2	2026-10-27 15:32:58.553	\N
94c9e7c6-ce38-4182-8f3f-13cdae4eeceb	f231cc42-1887-4ddb-8c37-8b1ad55e9594	1de7f058-28c0-4547-a3ba-32004943e9ab	2026-10-27 15:54:46.861	\N
5b2083c6-352a-4437-a603-229c3405db49	789e89c4-689a-4dec-b107-51c7e07ed00c	cba806b5-7857-455e-a5cb-13d204828efc	2026-10-27 17:30:26.157	\N
\.


--
-- Data for Name: logs_acceso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs_acceso (id, usuario_id, ip_address, user_agent, fecha) FROM stdin;
\.


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificaciones (id, usuario_id, evento_id, titulo, mensaje, tipo, leida, fecha_envio) FROM stdin;
30b8fc3f-1113-4ae2-9b9d-1b284e1bf311	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 5 pilotos para la Manga 1 del grupo 125cc Stock.	resultados	t	2026-09-21 02:05:47.969
a302323a-1d65-4ea5-a0ad-b213010a7cf8	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 10 pilotos para la Manga 1 del grupo 125cc Stock.	resultados	t	2026-09-21 02:12:49.773
621c5bb1-3f49-48cb-814f-d9a2029627ef	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 10 pilotos para la Manga 1 del grupo 125cc Stock.	resultados	t	2026-09-21 02:25:16.994
e4ecac08-ce7a-47d8-9d38-da599c29823d	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 10 pilotos para la Manga 2 del grupo 125cc Stock.	resultados	t	2026-09-21 02:25:29.603
e6de0fa8-9f43-4ad9-851a-1d3c6ff48ab7	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 10 pilotos para la Manga 2 del grupo 125cc Stock.	resultados	t	2026-09-21 02:26:09.819
052a7905-1ab0-450d-9600-8049d6212018	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 10 pilotos para la Manga 1 del grupo 125cc Stock.	resultados	t	2026-09-21 03:30:56.742
412cd4ef-0b8b-401f-a084-858d25975d06	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 10 pilotos para la Manga 2 del grupo 125cc Stock.	resultados	t	2026-09-21 03:31:11.51
f830dff3-aa98-4b1f-b1a6-6e90b217a3f5	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 10 pilotos para la Manga 1 del grupo 125cc Stock.	resultados	t	2026-09-21 03:33:38.6
60197e4b-50f3-4e16-8134-be283c02fbc8	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 12 pilotos para la Manga 2 del grupo 125cc Stock.	resultados	t	2026-09-21 04:44:56.486
bf203c36-f40e-421e-ad27-71b9c4428dce	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 12 pilotos para la Manga 2 del grupo 125cc Stock.	resultados	t	2026-09-21 04:43:36.666
5ec19142-e187-473a-8358-1b0b40017899	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 12 pilotos para la Manga 1 del grupo 125cc Stock.	resultados	t	2026-09-21 04:41:53.063
d9344232-4f74-4567-959f-20faf8852388	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 10 pilotos para la Manga 2 del grupo 125cc Stock.	resultados	t	2026-09-21 03:36:21.285
81eda5a4-5e72-421f-bfa2-a95d0b59636c	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 10 pilotos para la Manga 1 del grupo 125cc Stock.	resultados	t	2026-09-21 03:36:10.152
182094e1-c0b1-4a05-9312-be0e047c4713	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 10 pilotos para la Manga 2 del grupo 125cc Stock.	resultados	t	2026-09-21 03:33:49.762
3e0aa9db-5b6e-47be-82ce-90e083e9998b	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 1 registrada	Se registraron 5 pilotos para la Manga 1 del grupo 160cc Libre.	resultados	t	2026-09-21 04:53:06.514
bee210ac-fa30-4550-87a9-de83b4f26ac8	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	\N	Manga 2 registrada	Se registraron 5 pilotos para la Manga 2 del grupo 160cc Libre.	resultados	t	2026-09-21 04:53:25.891
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagos (id, inscripcion_id, monto, metodo_pago, id_transaccion, fecha_pago, estado_pago, moneda, nit_factura, nombre_factura, direccion_factura) FROM stdin;
\.


--
-- Data for Name: patrocinadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patrocinadores (id, nombre, logo_url, sitio_web, contacto) FROM stdin;
pat-01	Yamaha Guatemala	https://yamaha.com/logo.png	https://yamaha.com.gt	info@yamaha.com.gt
pat-02	Seguros Universales	\N	https://segurosuniversales.com.gt	seguros@su.com.gt
pat-03	Mapfre Guatemala	\N	https://mapfre.com.gt	contacto@mapfre.com.gt
\.


--
-- Data for Name: patrocinadores_campeonatos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patrocinadores_campeonatos (patrocinador_id, campeonato_id, nivel) FROM stdin;
\.


--
-- Data for Name: patrocinadores_eventos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patrocinadores_eventos (patrocinador_id, evento_id, nivel) FROM stdin;
\.


--
-- Data for Name: perfiles_personales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.perfiles_personales (id, usuario_id, cui, fecha_nacimiento, genero, telefono_personal, direccion) FROM stdin;
pp-01	pil-u-01	2501234560101	1995-03-15 00:00:00	M	50231001	Zona 10, Guatemala
pp-02	pil-u-02	2501234560202	1998-07-22 00:00:00	M	50231002	Zona 1, Guatemala
pp-03	pil-u-03	2501234560303	2000-11-08 00:00:00	M	50231003	Zona 14, Guatemala
pp-04	pil-u-04	2501234560404	1993-05-30 00:00:00	M	50231004	Mixco, Guatemala
pp-05	pil-u-05	2501234560505	2002-01-12 00:00:00	M	50231005	Villa Nueva, Guatemala
pp-06	pil-u-06	2501234560606	1990-09-25 00:00:00	M	50231006	Quetzaltenango
pp-07	pil-u-07	2501234560707	1997-04-18 00:00:00	M	50231007	Escuintla
pp-08	pil-u-08	2501234560808	2001-06-03 00:00:00	M	50231008	Chimaltenango
pp-09	pil-u-09	2501234560909	1988-12-14 00:00:00	M	50231009	Antigua, Sacatepéquez
pp-10	pil-u-10	2501234561010	1996-08-27 00:00:00	M	50231010	Petén
pp-11	pil-u-11	2501234561111	1999-02-09 00:00:00	M	50231011	Alta Verapaz
pp-12	pil-u-12	2501234561212	2003-10-16 00:00:00	M	50231012	Huehuetenango
pp-13	pil-u-13	2501234561313	1991-07-04 00:00:00	M	50231013	Jutiapa
pp-14	pil-u-14	2501234561414	1994-03-21 00:00:00	M	50231014	Jalapa
pp-15	pil-u-15	2501234561515	2000-05-17 00:00:00	M	50231015	Santa Rosa
pp-16	pil-u-16	2501234561616	1987-11-30 00:00:00	M	50231016	Izabal
pp-17	pil-u-17	2501234561717	2001-08-11 00:00:00	F	50231017	Zona 15, Guatemala
pp-18	pil-u-18	2501234561818	1992-01-24 00:00:00	M	50231018	Suchitepéquez
pp-19	pil-u-19	2501234561919	1998-04-06 00:00:00	M	50231019	Retalhuleu
pp-20	pil-u-20	2501234562020	1995-09-19 00:00:00	F	50231020	Zona 13, Guatemala
f424485c-c72a-4d67-9bdf-262f5fcb6333	5d9b01db-de71-488a-a175-34a316adbfe4	1234567890123	\N	\N	56214123	11av A, 3-77, Zona 11, San Miguel Petapa
d3f2a3c1-6cd4-4238-b339-30fdc02186f9	bf0fdaf8-ea11-4f38-bdbf-8ba56154831c	1111222211112	\N	\N	12345678	\N
2c0aada7-3a9b-4f0d-9426-3d115185e45e	ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a	abcd	\N	\N	hola	asad12
bc395726-5de2-408d-8a20-691796f7be8c	acd4423a-028f-4643-a9d2-e85028d41c8a	\N	\N	\N	43232343	12av 3-45 Residenciales Alamedas
d3d7597d-0800-47d2-9a28-a49c3ae50a9a	4932b935-1bbd-4bae-8bc1-b29d02fe63ef	\N	\N	\N	50212345678	11av A 4-99, zona 1, Guatemala
029ca3bb-56bc-4014-8a32-5c9d830f026f	f98c3274-9c2b-479c-90eb-285b20855d2d	\N	\N	\N	\N	\N
f967c3e2-d618-46d4-8e44-db58bdf77a3d	e2661597-9c39-4bc8-a7e5-7928bb0b6e11	\N	\N	\N	\N	\N
b7eac894-b4d7-44cb-944b-653a94d721e9	29bd2f86-00b8-4aef-8b4a-8a21e2092fcd	9999999990101	\N	\N	77777777	\N
9196c441-e299-4843-8293-5e9cc8ac6295	188dcded-0eae-48e5-b93b-b085b4313f71	\N	\N	\N	\N	\N
65c47eaa-6535-40e2-9649-2b77e124f98f	181ec4be-9969-4f83-9e9b-096672d2b86f	\N	\N	\N	50256214123	121sdasd adfsgr ahsgdhsad
df3aad12-4a2a-4afa-a274-6ea54a89781c	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	3727 10026 0101	2004-04-20 00:00:00	M	+50265364564	11 calle, 4-55, Zona 2, Guatemala
c2e8c6f4-3980-4ded-90ca-c3ed13716982	25332652-7bdf-4697-a2b0-c1813d002760	\N	\N	F	+50250212345	12av 3ra calle, zona 1
129c0626-0709-47c2-9498-be2619c9d005	e9f80104-d0a1-4e14-86df-f14e05169de3	\N	\N	\N	50223232323	12asahf
4772554c-5cc1-4b63-b8d4-cc550483debf	7e7393a0-d67c-4c19-bed2-d9fbb25fa4ae	\N	\N	\N	\N	\N
85b44684-4c1d-4204-8a4b-e2c37171ea73	aa3a3fb0-cb7a-457e-a43e-612e3e62b729	\N	\N	\N	+50234343434	11av aaxljw 3ra av
71acd2c9-4755-4658-97bf-aa9bf15bb917	49de7aea-1e5d-44d2-a9ad-677baa3522d1	7463 74673 4734	2026-09-02 00:00:00	\N	+50223232121	\N
80ed11b3-de4f-425a-ad97-7211acce7d5e	99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16	7637 46744 7346	2004-06-13 00:00:00	\N	+523624783264	\N
2a245cee-0297-422d-ad5e-3563645da6b4	20d6e041-9399-4373-874b-af6922811bf7	\N	\N	\N	\N	\N
2bb5dc8f-27c6-4bc8-9de7-a3041eac6a4d	00c5945d-ae51-49bc-a585-0c792b2a45e6	\N	\N	\N	\N	\N
f3db0504-795d-42fb-84bb-3c6147210481	5c2ed4c6-8769-4699-91bf-bc61150d0f37	\N	\N	\N	\N	\N
f0285498-1d01-48da-a1d8-8163a671e9b5	85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b	3501 05350 0101	2002-02-12 00:00:00	\N	+50256252922	\N
d182b856-82de-4e00-8ec8-43f1aabc0e4f	f4276a72-1138-49f1-b210-bd46d1484d57	1111 11111 1111	\N	\N	+50231141143	\N
f904604c-1ee9-4378-90c2-77a7c881cec2	aafb5462-269d-47a8-8319-dab9c71a9f75	8796 73687 3264	2004-07-09 00:00:00	\N	+10291028192	\N
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permisos (id, clave, descripcion) FROM stdin;
perm-01	USUARIOS_VER	Ver usuarios
perm-02	USUARIOS_GESTIONAR	Crear y editar usuarios
perm-03	EVENTOS_VER	Ver eventos
perm-04	EVENTOS_GESTIONAR	Crear y editar eventos
perm-05	INSCRIPCIONES_VER	Ver inscripciones
perm-06	INSCRIPCIONES_GESTIONAR	Gestionar inscripciones
perm-07	RESULTADOS_VER	Ver resultados
perm-08	RESULTADOS_CARGAR	Cargar resultados de heats
perm-09	SANCIONES_GESTIONAR	Aplicar sanciones
perm-10	REPORTES_VER	Generar reportes
\.


--
-- Data for Name: plantillas_notificacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plantillas_notificacion (id, clave, titulo, cuerpo, tipo, descripcion) FROM stdin;
6b5e1084-bcc4-4888-a606-fdce8c89ad97	confirmacion_inscripcion	Confirmación de inscripción	Hola {nombre}, tu inscripción al evento {evento} fue confirmada.	inscripcion	\N
beb24d03-aea2-4cc9-8074-19be66abb45a	documentos_por_vencer	Documentos por vencer	Recordá renovar tu licencia antes del evento {evento}.	documento	\N
72691f1a-d893-49f8-99c7-0504fb7cfee8	cambio_horario	Cambio de horario	El cronograma del evento {evento} fue modificado.	horario	\N
cf8a22ce-7fed-4685-aa5d-4d5df253a094	resultados_publicados	Resultados publicados	Los resultados del evento {evento} ya están disponibles.	resultados	\N
78dfc2b3-03bb-4e3e-adf5-bbd975dde067	sancion_aplicada	Sanción aplicada	Se aplicó una sanción a tu inscripción en el evento {evento}.	sancion	\N
de480634-6c9b-4945-a849-ca841316675c	pago_pendiente	Pago pendiente	Tu inscripción al evento {evento} tiene un pago pendiente.	pago	\N
7e39a5ff-7900-4428-a5ea-5fdc4232a218	inscripcion_rechazada	Inscripción rechazada	Tu inscripción al evento {evento} fue rechazada.	inscripcion	\N
68894636-4fb8-46f5-af7d-6a4e78bf1758	apertura_inscripciones	Apertura de inscripciones	Las inscripciones del evento {evento} están abiertas.	evento	\N
48a147c2-6a3b-4c89-ab58-e11e39babcce	backup_completado	Backup completado	El respaldo del sistema se completó correctamente.	sistema	\N
\.


--
-- Data for Name: preferencias_sistema; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preferencias_sistema (id, clave, valor, descripcion) FROM stdin;
pref-01	velocidad_max_pit_lane	30	Velocidad máxima km/h en pit lane
pref-02	velocidad_max_paddock	15	Velocidad máxima km/h en paddock
pref-03	limite_ausencias	2	Ausencias consecutivas para liberar número
pref-04	porcentaje_validez_heat	75	Porcentaje mínimo para heat válido
pref-05	monto_protesta	500	Monto GTQ protesta deportiva
pref-06	monto_apelacion	2000	Monto GTQ caución de apelación
pref-07	nombre_campeonato	Campeonato ACMG 2026	Nombre del campeonato activo
pref-08	email_contacto	info@acmg.gt	Email de contacto del campeonato
\.


--
-- Data for Name: reglamento_articulos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reglamento_articulos (id, codigo, titulo, texto, area, creado_por, "createdAt", evento_id, origen) FROM stdin;
ad772607-23a9-45af-9d7e-7f7a7143ce52	ART. 12.1	Velocidad en pit lane	Todo piloto no debe exceder el limite de velocidad en pit lane (60 km/h). El piloto que exceda la velocidad en la salida de boxes sera penalizado por el comisariato.	CORRIDA	6a461f7e-873d-46c1-8965-85dd7aa479ab	2026-10-26 01:55:24.777	\N	MANUAL
84a48a15-f45f-4b7f-bb3d-048cd194a5d5	ART. 7.1	Humo en la parrilla de largada	Está prohibido generar humo intencionalmente mientras la parrilla de largada se encuentra formada. El piloto que encienda la moto o acelere en vacío produciendo humo sobre la parrilla recibirá una advertencia oficial y perderá dos posiciones de largada; en caso de reincidencia la descalificación del heat correspondiente. ARTÍCULO 7.2 -	\N	\N	2026-10-25 22:03:18.342	632508e2-8a71-4e0c-b32f-b14f7b6e2808	PDF
6f26b8c1-d34a-49fe-a2aa-bc4986531e7d	ART. 7.2	Uso de silenciadores	Toda motocicleta debe conservar el silenciador homologado. Superar el nivel sonoro permitido implica rechazo en la revisión técnica. ARTÍCULO 7.3 -	\N	\N	2026-10-25 22:03:18.344	632508e2-8a71-4e0c-b32f-b14f7b6e2808	PDF
df086cab-5125-4939-9d49-f0dd7ecf23e7	ART. 7.3	Velocidad en pit lane	La velocidad máxima en pit lane es de 60 km/h el día del evento. La infracción se sanciona con penalización de tres posiciones. -- 1 of 1 --	\N	\N	2026-10-25 22:03:18.345	632508e2-8a71-4e0c-b32f-b14f7b6e2808	PDF
\.


--
-- Data for Name: reglamento_documentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reglamento_documentos (id, evento_id, nombre, ruta_archivo, paginas, texto, estado, creado_por, created_at) FROM stdin;
f7a81a6b-bede-48a4-9b26-44a335013509	632508e2-8a71-4e0c-b32f-b14f7b6e2808	reglamento-acmg-1a.pdf	/uploads/reglamento/ev-632508e2-1792987398313.pdf	1	REGLAMENTO PARTICULAR ACMG 2026\nEvento: ACMG 2026 - 1a Fecha · Emitido por el Colegio de Comisarios\nARTÍCULO 7.1 - Humo en la parrilla de largada\nEstá prohibido generar humo intencionalmente mientras la parrilla de largada se encuentra formada. El piloto que\nencienda la moto o acelere en vacío produciendo humo sobre la parrilla recibirá una advertencia oficial y perderá\ndos posiciones de largada; en caso de reincidencia la descalificación del heat correspondiente.\nARTÍCULO 7.2 - Uso de silenciadores\nToda motocicleta debe conservar el silenciador homologado. Superar el nivel sonoro permitido implica rechazo en la\nrevisión técnica.\nARTÍCULO 7.3 - Velocidad en pit lane\nLa velocidad máxima en pit lane es de 60 km/h el día del evento. La infracción se sanciona con penalización de tres\nposiciones.\n\n-- 1 of 1 --	PROCESADO	6a461f7e-873d-46c1-8965-85dd7aa479ab	2026-10-25 22:03:18.33997
\.


--
-- Data for Name: reglamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reglamentos (id, categoria_id, archivo_url, version, ultima_actualizacion) FROM stdin;
\.


--
-- Data for Name: reportes_generados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_generados (id, usuario_id, tipo, archivo_url, generado_en) FROM stdin;
\.


--
-- Data for Name: resultados_tiempos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resultados_tiempos (id, heat_id, inscripcion_id, posicion, mejor_vuelta, tiempo_total, puntos_ganados, estatus_carrera, vuelta_1, vuelta_2, vueltas_completadas) FROM stdin;
124f7ecd-d8cf-410a-8011-8853f6b96281	16023bb9-ed54-4f96-abe5-80c7e68cd62c	da3a2097-3b19-4c6d-bcc6-0c0e797b2175	0	01:21.222	\N	0	CLASIFICACION	01:22.323	01:21.222	\N
bed3bd3c-2ae2-4d68-b4da-8722f8aef004	16023bb9-ed54-4f96-abe5-80c7e68cd62c	10ddcd5f-1115-4fa9-9b17-277100dc35a4	0	01:21.272	\N	0	CLASIFICACION	01:21.272	01:21.625	\N
2ae013e3-0b1e-4523-8005-2ca0947cbf31	16023bb9-ed54-4f96-abe5-80c7e68cd62c	5627eaf4-9bb6-4fd5-bb8a-41de3eddb903	0	01:21.325	\N	0	CLASIFICACION	01:23.235	01:21.325	\N
84b00e95-1e5b-4ec9-b373-3e8299c63c13	16023bb9-ed54-4f96-abe5-80c7e68cd62c	4493d767-8cd0-4e4e-9e5e-12b709590ad4	0	01:22.534	\N	0	CLASIFICACION	01:25.342	01:22.534	\N
1a77c76a-9a8a-4b63-9aff-6a1d43c99ef7	16023bb9-ed54-4f96-abe5-80c7e68cd62c	ba6c4f8d-ddea-4794-a1c0-eda62beea302	0	01:22.534	\N	0	CLASIFICACION	01:22.534	01:65.365	\N
1866a6a6-fc19-431d-8a06-e2059accebd6	16023bb9-ed54-4f96-abe5-80c7e68cd62c	2f793bcb-8623-487c-9ea3-28665fc9fecb	0	01:23.232	\N	0	CLASIFICACION	01:23.232	01:23.232	\N
2a706544-3c7b-4579-bae5-7068151d911d	16023bb9-ed54-4f96-abe5-80c7e68cd62c	99dc7db0-798a-42ea-bda5-4366358a3af5	0	02:22.637	\N	0	CLASIFICACION	02:76.327	01:82.637	\N
3ea1be02-a7cd-480b-9dcd-1248dff33d03	16023bb9-ed54-4f96-abe5-80c7e68cd62c	d18e47a8-9d6d-4bc6-a703-4a35834ec153	0	20:11.827	\N	0	CLASIFICACION	91:82.978	19:71.827	\N
6a2ab821-0d77-4127-a59f-c0f863938d25	16023bb9-ed54-4f96-abe5-80c7e68cd62c	2620a7f2-5117-4f5b-a0a2-598a3e3f71e9	0	92:37.197	\N	0	CLASIFICACION	99:17.823	91:97.197	\N
f5b1a205-8746-48f8-9c8e-e1263dc45021	16023bb9-ed54-4f96-abe5-80c7e68cd62c	9d2a8b5b-bab4-42a9-990e-9f34661b4fc6	0	98:19.278	\N	0	CLASIFICACION	97:82.781	98:19.278	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, nombre, descripcion) FROM stdin;
role-admin	ADMIN	Acceso total al sistema
role-staff	STAFF	Recepcionista e inscripciones
role-comisario	COMISARIO	Comisario deportivo y técnico
role-piloto	PILOTO	Piloto participante del campeonato
78925864-49de-4b7f-8b7b-fc23c4707130	Cronometraje	Oficial de crono manual
\.


--
-- Data for Name: roles_permisos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles_permisos (rol_id, permiso_id) FROM stdin;
role-admin	perm-01
role-admin	perm-02
role-admin	perm-03
role-admin	perm-04
role-admin	perm-05
role-admin	perm-06
role-admin	perm-07
role-admin	perm-08
role-admin	perm-09
role-admin	perm-10
role-staff	perm-03
role-staff	perm-05
role-staff	perm-06
role-staff	perm-10
role-comisario	perm-03
role-comisario	perm-05
role-comisario	perm-07
role-comisario	perm-09
role-comisario	perm-10
role-piloto	perm-03
role-piloto	perm-07
\.


--
-- Data for Name: sesiones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sesiones (id, usuario_id, token, ip_address, user_agent, expira_en, creada_en) FROM stdin;
\.


--
-- Data for Name: tokens_recuperacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tokens_recuperacion (id, usuario_id, token, expira_en, usado, creado_en) FROM stdin;
\.


--
-- Data for Name: usuarios_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios_roles (usuario_id, rol_id) FROM stdin;
usr-admin	role-admin
usr-staff	role-staff
usr-comis	role-comisario
pil-u-01	role-piloto
pil-u-02	role-piloto
pil-u-03	role-piloto
pil-u-04	role-piloto
pil-u-05	role-piloto
pil-u-06	role-piloto
pil-u-07	role-piloto
pil-u-08	role-piloto
pil-u-09	role-piloto
pil-u-10	role-piloto
pil-u-11	role-piloto
pil-u-12	role-piloto
pil-u-13	role-piloto
pil-u-14	role-piloto
pil-u-15	role-piloto
pil-u-16	role-piloto
pil-u-17	role-piloto
pil-u-18	role-piloto
pil-u-19	role-piloto
pil-u-20	role-piloto
7934425f-13dd-406d-bb8e-d6a292f5ed74	role-piloto
bf0fdaf8-ea11-4f38-bdbf-8ba56154831c	role-piloto
ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a	role-piloto
acd4423a-028f-4643-a9d2-e85028d41c8a	role-piloto
4932b935-1bbd-4bae-8bc1-b29d02fe63ef	role-piloto
f98c3274-9c2b-479c-90eb-285b20855d2d	role-piloto
e2661597-9c39-4bc8-a7e5-7928bb0b6e11	role-piloto
cc3a6098-e94f-41b3-8dc6-cb82ada812c8	role-admin
6a461f7e-873d-46c1-8965-85dd7aa479ab	role-comisario
b5f6e13b-8c29-4fa8-83ef-d61242f2f34f	role-piloto
bf0be7bc-3cc0-4e64-8e01-672861fa6d52	role-staff
235f2006-67c6-4d50-9e15-4f4d094e6827	role-piloto
29bd2f86-00b8-4aef-8b4a-8a21e2092fcd	role-piloto
928464d6-00f5-41b6-9e72-ea1e5d506e66	role-staff
188dcded-0eae-48e5-b93b-b085b4313f71	role-piloto
181ec4be-9969-4f83-9e9b-096672d2b86f	role-piloto
25332652-7bdf-4697-a2b0-c1813d002760	role-piloto
5d9b01db-de71-488a-a175-34a316adbfe4	role-admin
e9f80104-d0a1-4e14-86df-f14e05169de3	role-piloto
7e7393a0-d67c-4c19-bed2-d9fbb25fa4ae	role-piloto
aa3a3fb0-cb7a-457e-a43e-612e3e62b729	role-piloto
49de7aea-1e5d-44d2-a9ad-677baa3522d1	role-piloto
99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16	role-piloto
00c5945d-ae51-49bc-a585-0c792b2a45e6	role-piloto
5c2ed4c6-8769-4699-91bf-bc61150d0f37	role-admin
20d6e041-9399-4373-874b-af6922811bf7	role-comisario
85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b	78925864-49de-4b7f-8b7b-fc23c4707130
f4276a72-1138-49f1-b210-bd46d1484d57	role-piloto
aafb5462-269d-47a8-8319-dab9c71a9f75	role-piloto
\.


--
-- PostgreSQL database dump complete
--

\unrestrict Gcxu0KymfnngJB1IKdPnJvtdcbSiqUvZOo8t1QEPdvfFzqRHi4yn3qVcQ41rueO

