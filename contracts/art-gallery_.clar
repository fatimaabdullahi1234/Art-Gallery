;; Decentralized Autonomous Art Gallery

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-already-listed (err u103))
(define-constant err-not-for-sale (err u104))
(define-constant err-insufficient-funds (err u105))
(define-constant err-invalid-price (err u106))
(define-constant err-transfer-failed (err u107))

;; Data variables
(define-data-var next-artwork-id uint u0)
(define-data-var next-exhibition-id uint u0)
(define-data-var platform-fee uint u50) ;; 5% fee (1000 = 100%)

;; Data maps
(define-map artworks
  { artwork-id: uint }
  {
    artist: principal,
    title: (string-utf8 100),
    description: (string-utf8 500),
    price: uint,
    owner: principal,
    for-sale: bool
  }
)

(define-map exhibitions
  { exhibition-id: uint }
  {
    curator: principal,
    title: (string-utf8 100),
    description: (string-utf8 500),
    artwork-ids: (list 50 uint),
    start-block: uint,
    end-block: uint
  }
)

(define-map exhibition-rights
  { artwork-id: uint, exhibition-id: uint }
  { approved: bool }
)

;; Private functions
(define-private (is-owner)
  (is-eq tx-sender contract-owner)
)

(define-private (transfer-artwork (artwork-id uint) (new-owner principal))
  (match (map-get? artworks { artwork-id: artwork-id })
    artwork (ok (map-set artworks
              { artwork-id: artwork-id }
              (merge artwork { owner: new-owner, for-sale: false })))
    (err err-not-found)
  )
)

(define-private (calculate-platform-fee (price uint))
  (/ (* price (var-get platform-fee)) u1000)
)

;; Public functions
(define-public (create-artwork (title (string-utf8 100)) (description (string-utf8 500)) (price uint))
  (let
    ((artwork-id (var-get next-artwork-id)))
    (map-set artworks
      { artwork-id: artwork-id }
      {
        artist: tx-sender,
        title: title,
        description: description,
        price: price,
        owner: tx-sender,
        for-sale: true
      }
    )
    (var-set next-artwork-id (+ artwork-id u1))
    (ok artwork-id)
  )
)

(define-public (update-artwork-price (artwork-id uint) (new-price uint))
  (let
    ((artwork (unwrap! (map-get? artworks { artwork-id: artwork-id }) (err err-not-found))))
    (asserts! (is-eq (get owner artwork) tx-sender) (err err-unauthorized))
    (asserts! (> new-price u0) (err err-invalid-price))
    (ok (map-set artworks
      { artwork-id: artwork-id }
      (merge artwork { price: new-price, for-sale: true })))
  )
)

(define-public (buy-artwork (artwork-id uint))
  (let
    ((artwork (unwrap! (map-get? artworks { artwork-id: artwork-id }) (err err-not-found)))
     (buyer tx-sender)
     (seller (get owner artwork))
     (price (get price artwork))
     (fee (calculate-platform-fee price)))
    (asserts! (not (is-eq buyer seller)) (err err-unauthorized))
    (asserts! (get for-sale artwork) (err err-not-for-sale))
    (match (stx-transfer? price buyer seller)
      success (match (stx-transfer? fee buyer contract-owner)
                fee-success (transfer-artwork artwork-id buyer)
                fee-error (err err-transfer-failed))
      error (err err-insufficient-funds))
  )
)

(define-public (create-exhibition (title (string-utf8 100)) (description (string-utf8 500)) (artwork-ids (list 50 uint)) (duration uint))
  (let
    ((exhibition-id (var-get next-exhibition-id))
     (start-block block-height)
     (end-block (+ block-height duration)))
    (map-set exhibitions
      { exhibition-id: exhibition-id }
      {
        curator: tx-sender,
        title: title,
        description: description,
        artwork-ids: artwork-ids,
        start-block: start-block,
        end-block: end-block
      }
    )
    (var-set next-exhibition-id (+ exhibition-id u1))
    (ok exhibition-id)
  )
)

(define-public (approve-exhibition-rights (artwork-id uint) (exhibition-id uint))
  (let
    ((artwork (unwrap! (map-get? artworks { artwork-id: artwork-id }) (err err-not-found))))
    (asserts! (is-eq (get owner artwork) tx-sender) (err err-unauthorized))
    (ok (map-set exhibition-rights
      { artwork-id: artwork-id, exhibition-id: exhibition-id }
      { approved: true }))
  )
)

(define-public (set-platform-fee (new-fee uint))
  (begin
    (asserts! (is-owner) (err err-owner-only))
    (asserts! (<= new-fee u1000) (err err-invalid-price))
    (ok (var-set platform-fee new-fee))
  )
)

;; Read-only functions
(define-read-only (get-artwork (artwork-id uint))
  (ok (map-get? artworks { artwork-id: artwork-id }))
)

(define-read-only (get-exhibition (exhibition-id uint))
  (ok (map-get? exhibitions { exhibition-id: exhibition-id }))
)

(define-read-only (get-exhibition-rights (artwork-id uint) (exhibition-id uint))
  (ok (default-to { approved: false }
    (map-get? exhibition-rights { artwork-id: artwork-id, exhibition-id: exhibition-id })))
)

(define-read-only (get-platform-fee)
  (ok (var-get platform-fee))
)

